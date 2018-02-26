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

         let siblings = el.parentNode.querySelectorAll(".active-shortcuts:not(.gu-transit)")
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

<style lang="scss" scoped>

@import "../settings/theme.scss";

.keyboard {
   font-size: $keyboard-font-size;
   .active-shortcuts {
      cursor: pointer;
      position: absolute;
      top:$keyboard-font-size * 1.3;
      bottom: 0;
      left: 0;
      right:0;
      // word-break: break-all;
      font-size: 0.9em;
      display: flex;
      justify-content: center;
      align-items: center;
      border: (0.1 * $keyboard-font-size) solid rgb(0, 0, 116);
      background: rgb(46, 46, 71);
      & > div {
         text-align: center;
         user-select: none;
      }
   }
   .will_replace {
   }
   .will_be_replaced {
      // top: calc(#{$keyboard-font-size  * 1.3} + 100%);
      top: 100%;
      bottom: auto;
      z-index: 1;
      border-color: red;
   }
   .unselectable {
      background:red;
      border: red;
   }
   .pressed > .dec {
      border-color: $pressed-color !important;
   }
   .chain-pressed > .dec::before {
      content: "";
      position: absolute;
      top:-$cap-spacing;
      bottom:-$cap-spacing;
      left:-$cap-spacing;
      right:-$cap-spacing;
      border-color: mix($chain-pressed-color,rgba(0,0,0,0), 50%) !important;
      border-style: dotted;
   }

   .key-row {
      // height: $base_size;
      padding-bottom: $base-size;
      height:0;
      display:flex;
      flex-wrap: wrap;
      & > * {
         flex-grow: 0;
         flex-shrink: 0;
      }
   }

   .empty-row {
      padding-bottom: $base-size/2;
   }

   .key { 
      width: $base-size;
      // height: 100%;
      // border-radius: 2px;
      box-sizing: border-box;
      padding-bottom: $base-size;
      position:relative;
      .label {
         margin:5%;
         overflow: hidden;
         user-select: none;
      }
      .shrink {
         font-size:0.8em;
      }
      .dec {
         position:absolute;
         right: $cap-spacing;
         top: $cap-spacing;
         width: calc(100% - #{$cap-spacing*2});
         height: calc(100% - #{$cap-spacing*2});
         box-sizing: border-box;
         box-shadow: $cap-box-shadow;
      }
   }

   .five {
      width:5%;
      &:nth-child(odd) {
         background:green;
      }
      &:nth-child(even) {
         background:blue;
      }
   }

   .blank {
      background:none;
      box-shadow:none;
   }

   .spacer {
      padding-bottom: $base-size;
      width: 0.666 * $base_size;
   }

   .flexspace {
      padding-bottom: $base-size;
      flex:1 1 auto;
   }

   .vertical {
      padding-bottom: 2 * $base_size;
   }

   .space {
      // width:360px;
      width: 6.25 * $base_size;
   }
   .modifiers {
      // width:60px;
      width: 1.25 * $base_size;
   }
   .small {
      // width:60px;
      width: 1.5 * $base_size;
   }
   .medium-small {
      // width:80px;
      width: 1.75 * $base_size;
   }
   .medium {
      // width:80px;
      width: 2 * $base_size;
   }
   .medium-large {
      width: 2.25 * $base_size;
      // width:110px;
   }
   .huge {
      // width:140px;
      width: 2.75 * $base_size;
   }
}

</style>

