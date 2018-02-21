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
         <div v-if="chain.in_chain">Waiting on chain: {{normalize(chain.start, true).join("+")}}</div>
         <div v-if="chain.warning">No chained shortcut {{normalize(chain.last, true).join("+")}} {{normalize(chain.warning, true).join("+")}}</div>
         <div v-if="keymap_active.length > 0">Pressed: {{normalize(keymap_active, true).join("+")}}</div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'Keys',
   props: ["layout", "keys", "keymap", "keymap_active", "chain", "normalize", "shortcuts_active"],
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

}
</script>

<style lang="scss" scoped>

@import "../settings/theme.scss";
.keyboard {
   font-size: $keyboard-font-size;
}
.active-shortcuts {
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
   }
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
</style>

