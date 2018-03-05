<template>
   <div class="bin-container">
      <div class="bin">
         <div
            :class="['bin-entry', entry.chain_start ? 'is_chain':'']"
            v-for="(entry, index) in bin"
            :key="index+entry.command"
         ><span :index="index" class="command">{{entry.command}}</span><div
            class="remove"
            alt="remove"
            @click="remove(index)"
         >&#10006;</div></div>
      </div>
   </div>
</template>

<script>
import dragula from "dragula"
import {keys_from_text, normalize, multiplice} from "../helpers/helpers"
export default {
   name: 'Bin',
   props: ["bin", "shortcuts", "shortcuts_active", "keymap", "keymap_active", "modifiers_names", "modifiers_order", "chain"],
   data() {
      return {
         endkey: false,
      }
   },
   methods: {
      remove (index) {
         this.bin.splice(index)
      },
      move(entry, index, new_shortcut) {
         if (entry.chain_start) {
            let indexes = this.bin.map((existing_entry, index) => {
               if (existing_entry.chained && existing_entry._shortcut[0].join("") == entry._shortcut[0].join("")) {
                  return index
               }
            }).filter(entry => typeof entry !== "undefined")
            for (let entry_index of indexes) {
               let existing_entry = this.bin[entry_index]
               existing_entry._shortcut[0] = new_shortcut[0]
               existing_entry.shortcut = existing_entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")
               this.shortcuts.push(existing_entry)
            }
            multisplice(this.bin, indexes)
         }
         this.bin.splice(index, 1)
         entry._shortcut = new_shortcut
         entry.shortcut = entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")
         this.shortcuts.push(entry)
      },
   },
   computed: {
   },
   mounted() {
      let container_keys = this.$el.querySelectorAll(".bin")
      
      let drake = dragula([...container_keys], {
         mirrorContainer: this.$el.querySelector(".bin"),
         revertOnSpill: true, //so cancel will revert position of element
         isContainer: function (el) {
            return el.classList.contains("bin") || el.classList.contains("dec") || (el.classList.contains("drag") && el.classList.contains("command"))
         },
         moves: function (el, source, handle, sibling) {
            return el.classList.contains("bin-entry")
         },
         accepts: (el, target, source, sibling) => {
            return target.classList.contains("dec") || target.classList.contains("drag") 
         },
      })
      drake
      .on("drag", (el)=> {
         this.$emit("freeze", true)
      })
      .on("over", (el, container, source) => {
         document.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         document.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))

         let is_key = container.classList.contains("dec")
         if (is_key) {
            let target_entry = container.querySelectorAll(".active-shortcuts")
            if (target_entry.length > 0) {
               target_entry.forEach(el => el.classList.add("will_be_replaced"))
               el.classList.add("will_replace")
            }
         } else {
            let type = _.without(container.classList, "drag")[0]
            
            let siblings = container.parentNode.querySelectorAll("." + type + " .text:not(.gu-transit)")
            let siblings_length = siblings.length

            if (siblings_length > 0) {
               el.classList.add("will_replace")
               siblings.forEach(el => el.classList.add("will_be_replaced"))
            } else {
               el.classList.remove("will_replace")
            }
         }

      })
      .on("out", (el, container, source) => {
         document.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         document.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))
      }) 
      .on("drop", (el, target, source, sibling)=> {
         let is_key = target.classList.contains("dec")
         let current_index = el.querySelector(".command").getAttribute("index") //TODO context
         let current_entry = this.bin[current_index]
         if (is_key) {
            let target_key = target.querySelector(".label").innerText
         
            target_key = keys_from_text(target_key, this)._shortcut[0][0]
            let target_combo = [this.chain.start, _.uniq([target_key, ...this.keymap_active]).sort()].filter(keyset => keyset.length !== 0)

            let target_command = target.querySelector(".active-shortcuts > div")
                     
            if (target_command !== null) {
               target_command = target_command.innerText
               let target_entry = this.shortcuts_active.findIndex(entry => {
                  return entry.command == target_command
                  && entry._shortcut.join("") == target_combo.join("")
               })
               
               target_entry = this.shortcuts_active[target_entry]
               let target_shortcut = target_entry._shortcut
               
               this.$emit("add", target_entry)
            } 
            this.move(current_entry, current_index, target_combo)
         } else {
            let target_command = target.parentNode.querySelector(".command .text:not(.gu-transit)").innerText
            let target_combo = target.parentNode.querySelector(".shortcut .text:not(.gu-transit)").innerText
            target_combo = keys_from_text(target_combo, this)._shortcut
            
            let target_entry_index = this.shortcuts_active.findIndex(entry => {
               return entry.command == target_command
               && entry._shortcut.join("") == target_combo.join("")
            })
            let target_entry = this.shortcuts_active[target_entry_index]
            
            this.$emit("add", target_entry)
            this.move(current_entry, current_index, target_combo)
         }
         //we don't actually want to drop the element and change the dom, vue will handle rerendering it in the proper place
         drake.cancel()
      }).on("cancel", (el, target, source, sibling)=> {
         document.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         document.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))
         this.$emit("freeze", false)
      })
   },

}
</script>

<style lang="scss">

@import "../settings/theme.scss";
@import "../settings/custom_dragula.scss";

.bin-container {
   margin: 0 $padding-size;
   min-height: 4.5em;
   border: 2px solid rgba(0,0,0,0);
}
.bin {
   flex: 1 0 100%;
   display: flex;
   flex-wrap: wrap;
   justify-content: center;
   padding: 0.5em;
   .bin-entry.gu-transit {
      display: none;
   }
   .bin-entry, .active-shortcuts.gu-transit {
      user-select: none;
      cursor: pointer;
      flex: 0 0 auto;
      border: 2px solid rgba(0,0,0,0);
      padding:0.5em;
      margin: 0.5em;
      position: relative;
      background: rgba(0,0,0,0.3);
      border: rgba(0,0,0,0) 0.2em solid;
      .remove {
         display: none;
         position: absolute;
         top: -0.7em;
         right: -0.7em;
         width: 1.2em;
         height: 1.2em;
         border: 2px solid mix(red, black, 80%);
         background: transparentize(red, 0.7);
         color: red;
         line-height: 1.2em;
         border-radius: 100%;
         text-align: center;
         cursor: pointer;
      }
      &:hover:not(.gu-transit, .gi-mirror) .remove {
         display: block;
      }
   }
   .gu-mirror {
      height: auto!important;
      width: auto !important;
      opacity: 1;
      background: hsla(hue($accent-color), 100%, 50%, 0.2);
   }
   .is_chain  {
      border: 2px solid rgba(0,0,0,1);
   }
   .active-shortcuts.gu-transit {
      border-color: $accent-color;
   }
   .active-shortcuts.is_chain {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      & div {
         flex: 0 0 auto;
      }
      &::after {
         content: "+";
         flex: 0 0 auto;
         padding-left: 0.2em;
         font-weight: bold;
         color: $dragging-will-be-replaced;
         font-size: 2em;
         line-height: 0.5em;
         max-height: 0.5em;
      }
   }
}
</style>

