<template>
   <div class="bin-container">
      <div class="bin">
         <div
            :class="['entry', entry.chain_start ? 'is_chain':'']"
            v-for="(entry, index) in bin"
            :key="index+entry.command"
         ><span class="command">{{entry.command}}</span><div
            class="remove"
            alt="remove"
            @click="remove(index)"
         >&#10006;</div></div>
      </div>
   </div>
</template>

<script>
import dragula from "dragula"
import {keys_from_text, normalize} from "../helpers/helpers"
export default {
   name: 'Keys',
   props: ["bin", "shortcuts", "keymap", "keymap_active", "modifiers_names", "modifiers_order", "chain"],
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
            _.pullAt(this.bin, indexes)
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
            return el.classList.contains("bin") || el.classList.contains("dec")
         },
         moves: function (el, source, handle, sibling) {
            return el.classList.contains("entry")
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
      })
      .on("out", (el, container, source) => {
      }) 
      .on("drop", (el, target, source, sibling)=> {
         let target_key = target.querySelector(".label").innerText
         
         target_key = keys_from_text(target_key, this)._shortcut[0][0]
         let target_combo = [this.chain.start, _.uniq([target_key, ...this.keymap_active]).sort()].filter(keyset => keyset.length !== 0)

         let entry_index = this.bin.findIndex(entry => {
            return entry.command == el.querySelector(".command").innerText
         })
         let entry = this.bin[entry_index]
         this.move(entry, entry_index, target_combo)
         
         //we don't actually want to drop the element and change the dom, vue will handle rerendering it in the proper place
         drake.cancel()
      }).on("cancel", (el, target, source, sibling)=> {
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
   .entry.gu-transit {
      display: none;
   }
   .entry, .active-shortcuts.gu-transit {
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

