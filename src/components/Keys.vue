<template>
   <div class="keyboard" tabIndex="1" @keydown="$emit('keydown', $event)">
      <div
         :class="['key-row', row.length == 0 ? 'empty-row': '']"
         v-for="(row, rindex) of layout"
         :key="rindex"
         :id="'key-row' + rindex"
      >
         <div
            v-if="keys[key]"
            v-for="(key, index) of row"
            :key="index"
            :id=[key]
            :class="[keys[key].classes,
               typeof keymap[keys[key].identifier] !=='undefined'
               && keymap[keys[key].identifier].active === true
                  ? 'pressed'
                  : '',
               typeof keymap[keys[key].identifier] !=='undefined'
               && keymap[keys[key].identifier].chain_active === true
                  ? 'chain-pressed'
                  : ''
            ]"
         >
            <div
               :class="[keys[key].ignore ? '' : 'dec']"
            >
               <div
                  v-if="
                     keys[key]
                     && !(keys[key].ignore == true)
                     "
                  :class="[{label: true}, keys[key].label_classes]"
               >
                  {{keys[key].character}}
               </div>
               <div
                  class="active-shortcuts"
                  v-if="
                     !key.is_modifier
                     && !keys[key].ignore
                     && typeof active_keys[keys[key].identifier] !== 'undefined'
                  "
               >
                  <div>{{active_keys[keys[key].identifier].command}}</div>
               </div>
            </div>
         </div>
      </div>
      <div class="status">
         <div v-if="chain.in_chain">Waiting on chain: {{normalize(chain.start).join("+")}}</div>
         <div v-if="chain.warning">No chained shortcut {{normalize(chain.last).join("+")}} {{normalize(chain.warning).join("+")}}</div>
         <div v-if="keymap_active.length > 0">Pressed: {{normalize(keymap_active).join("+")}}</div>
      </div>
   </div>
</template>

<script>
import dragula from "dragula"
import {keys_from_text, normalize} from "../helpers/helpers"
export default {
   name: 'Keys',
   props: ["layout", "keys", "keymap", "keymap_active", "chain", "normalize", "shortcuts_active", "pressed", "modifiers_order", "modifiers_names", "shortcuts"],
   components: {
   },
   data() {
      return {
         endkey: false,
         // active_keys: {}
      }
   },
   computed: {
      active_keys () {
         let active_keys = {}
         this.shortcuts_active.map(entry => {
            if (this.chain.in_chain && entry.chained) {
               let intersect = entry._shortcut[1].filter(identifier => !this.keymap[identifier].is_modifier)
               if (intersect.length == 1) {
                  active_keys[(intersect.join(""))] = entry
               } else if (intersect.length > 1){
                  throw "Invalid shortcut"
               }
            } else {
               let intersect = entry._shortcut[0].filter(identifier => !this.keymap[identifier].is_modifier)
               if (intersect.length == 1) {
                  active_keys[(intersect.join(""))] = entry
               } else if (intersect.length > 1){
                  throw "Invalid shortcut"
               }
            }
         })
         return active_keys
      }
   },
   mounted() {
      let container_keys = document.querySelectorAll(".dec")
      
      let drake = dragula([...container_keys], {
         mirrorContainer: this.$el,
         revertOnSpill: true, //so cancel will revert position of element
         isContainer: function (el) {
            return el.classList.contains(".dec")
         },
         moves: function (el, source, handle, sibling) {
            return el.classList.contains("active-shortcuts")
         },
         accepts: (el, target, source, sibling) => {
            if (!this.chain.in_chain) {
               let key = target.querySelector(".label").innerText
               key = keys_from_text(key, this)._shortcut[0][0]
               let combo = [key, ...this.keymap_active]
               let existing = this.shortcuts_active.findIndex(entry => {
                  return entry._shortcut[0].includes(key) 
               })
               let exists = existing == -1 ? false : true
               if (exists) {
                  let target_entry = this.shortcuts_active[existing]
                  if (!target_entry.chain_start) {return true}
               } else {
                  return true
               }
            } else {
               return true
            }
            //ELSE
            el.classList.remove("will_replace")
            this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
            target.querySelector(".active-shortcuts").classList.add("unselectable")
            return false
         },
      })
      drake
      .on("drag", ()=> {
         this.$emit("freeze_input", true)
      })
      .on("over", (el, container, source) => {
         let type = _.without(container.classList, "drag")[0]

         let siblings = container.parentNode.querySelectorAll(".active-shortcuts:not(.gu-transit)")
         let siblings_length = siblings.length

         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

         if (siblings_length > 0) {
            el.classList.add("will_replace")
            siblings.forEach(el => el.classList.add("will_be_replaced"))
         } else {
            el.classList.remove("will_replace")
         }
      })
      .on("drop", (el, target, source, sibling)=> {
         let key = target.querySelector(".label").innerText
         key = keys_from_text(key, this)._shortcut[0][0]
         
         let combo = [this.chain.start, [key, ...this.keymap_active]].filter(keyset => keyset.length !== 0)

         let oldkey = source.querySelector(".label").innerText
         oldkey =  keys_from_text(oldkey, this)._shortcut[0][0]
         

         let oldentry = this.shortcuts_active.filter(entry => {
            if (this.chain.in_chain) {
               return entry._shortcut[1].includes(oldkey) 
            } else {
               return entry._shortcut[0].includes(oldkey) 
            }
         })[0]
         let normalized = combo.map(keyset => normalize(keyset, this).join("+")).join(" ")
         
         let change = {
            old_entry: oldentry,
            new_entry: {
               shortcut: normalized,
               _shortcut: combo, //optional
               command: oldentry.command,
            }
         }
         
         this.$emit("edit", change)
         //we don't actually want to drop the element, vue will handle rerendering it in the proper place
         drake.cancel()
      }).on("cancel", (el, target, source, sibling)=> {
         this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".will_replaced").forEach(el => el.classList.remove("will_replaced"))
         this.$emit("freeze_input", false)
      })

   }

}
</script>

<style lang="scss">

@import "../settings/theme.scss";
@import "../settings/custom_dragula.scss";
@import "../settings/keyboard_base.scss";

.keyboard {
   padding: 0 $padding-size;
   .active-shortcuts {
      cursor: pointer;
      position: absolute;
      top:$keyboard-font-size * 1.3;
      bottom: 0;
      left: 0;
      right:0;
      font-size: $shortcut-font-size;
      text-align: center;
      display:flex;
      align-items: center;
      background: hsla(hue($accent-color), 100%, 50%, 0.2);
      & > div {
         text-align: center;
         user-select: none;
         word-break: break-word;
         max-height: 100%;
         overflow: hidden;
         padding: 0.1em;
      }
   }
   .gu-mirror {
      font-size: $shortcut-drag-font-size;
      width: auto !important;
      height: auto !important;
      right: auto !important;
      bottom: auto !important;
   }
   .will_replace {
      display: none;
   }
   .will_be_replaced {
      z-index: 1;
      border: 1px solid;
   }
   .pressed > .dec {
      border-color: $accent-color !important;
   }
   .chain-pressed > .dec::before {
      content: "";
      position: absolute;
      top:-$cap-spacing;
      bottom:-$cap-spacing;
      left:-$cap-spacing;
      right:-$cap-spacing;
      border-color: mix($accent-color,rgba(0,0,0,0), 50%) !important;
      border-style: dotted;
   }
}

</style>

