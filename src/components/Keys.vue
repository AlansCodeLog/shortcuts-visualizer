<template>
   <div class="keyboard">
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
               :class="[
               keys[key].classes.indexOf('flexspace') !== -1
               || keys[key].classes.indexOf('blank') !== -1
                  ? ''
                  : 'dec'
               ]"
            >
               <div
                  v-if="
                     keys[key]
                     && !(typeof keys[key].label == 'undefined'
                        || keys[key].ignore == true)
                     "
                  :class="[{label: true}, keys[key].label.classes]"
               >
                  {{keys[key].label.text}}
               </div>
               <div
                  class="active-shortcuts"
                  v-if="
                     !mod_codes.includes(key)
                     && !keys[key].toggle
                  "
               >
               </div>
            </div>
         </div>
      </div>
      <div class="shortcuts">
         <div class="entry"
            v-for="shortcut of shortcuts_active" :key="shortcut.shortcut+shortcut.command"
         >
            <div>{{shortcut.shortcut}}</div>
            <div>{{shortcut.command}}</div>
         </div>
         {{keymap_active}}
      </div>
   </div>
</template>

<script>

export default {
   name: 'Keys',
   props: ["options", "layout", "keys", "keymap", "shortcuts", "mod_codes", "chain"],
   data() {
      return {
         endkey: false
      }
   },
   computed: {
      none_mods() {
         let keys = []
         Object.keys(this.keymap).filter(keyname => {
            if (!this.mod_codes.includes(keyname) && this.keymap[keyname].toggle == false) {
               keys.push(keyname)
            }
         })
         return keys
      },
      shortcuts_active () {
         return this.shortcuts.filter(entry => {
            if (!this.chain.in_chain && !entry.chained) {
               if (entry.chain_start && entry._shortcut[0].length == this.keymap_active.length && _.difference(entry._shortcut[0], this.keymap_active).length == 0) {
                  this.$emit("chained", {in_chain: true, start: [...this.keymap_active], shortcut: entry.shortcut})
               }
               let extras = _.difference(entry._shortcut[0], this.keymap_active).filter(keyname => {
                  let none_mod = !this.none_mods.includes(keyname)
                  if (none_mod) {
                     return true
                  }
               })
               if (extras.length > 0) {
                  return false
               }
               let condition = _.difference(this.keymap_active, entry._shortcut[0]).filter(keyname => {
                     let in_shortcut = entry._shortcut[0].includes(keyname)
                     if (!in_shortcut) {
                        return true
                     }
                  })
               if (condition.length == 0) {
                  return entry
               }
            } else if (this.chain.in_chain && entry.chained) {
               let extras = _.difference(entry._shortcut[1], this.keymap_active).filter(keyname => {
                  let none_mod = !this.none_mods.includes(keyname)
                  if (none_mod) {
                     return true
                  }
               })
               if (extras.length > 0) {
                  return false
               }
               let condition = _.difference(this.keymap_active, entry._shortcut[1]).filter(keyname => {
                     let in_shortcut = entry._shortcut[1].includes(keyname)
                     if (!in_shortcut) {
                        return true
                     }
                  })
               if (condition.length == 0) {
                  return entry
               }
            } else {
               console.log("wtf");
            }
         })
      },
      keymap_active () {
         return Object.keys(this.keymap).filter(identifier => {
            let key = this.keymap[identifier];
            return key.active
         })
      },
      none_mods_in_active () {
         return _.intersection(this.keymap_active, this.none_mods)
      }
   }
}
</script>

<style lang="scss" scoped>

@import "../settings/theme.scss";

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
      font-size:0.8rem;
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

