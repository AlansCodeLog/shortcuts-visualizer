<template>
   <div
      id="app"
      :class="[options.theme_dark ? 'background-dark' : 'background-light']"
   >
      <Options
         :options="options"
         :modes="modes"
         @input="change('options', $event)"
      ></Options>
      <Keys
         :keys="keys"
         :keymap="keymap"
         :keymap_active="keymap_active"
         :shortcuts_active="shortcuts_active"
         :layout="layout"
         :chain="chain"
         :mod_codes="mod_codes"
         :none_mods="none_mods"
         :normalize="normalize"
         @keydown="keydown($event)"
         @keyup="keyup($event)"
         @chained="chained($event)"
      ></Keys>
      <ShortcutsList
         :shortcuts_active="shortcuts_active"
         :normalize="normalize"
         @edit="shortcut_edit($event)"
      ></ShortcutsList>
   </div>
</template>

<script>
import Keys from "./components/keys"
import Options from "./components/options"
import ShortcutsList from "./components/shortcut_list"

import {layout} from "./settings/layout.js"
import {keys} from "./settings/keys.js"
import {shortcuts} from "./settings/shortcuts.js"

import * as _ from "lodash"

let keymap = {}
let keynames = {}
//create keymap and keynames
Object.keys(keys).map(keyname=> {
   let key = keys[keyname]
   if ((typeof key.label == 'undefined' || key.ignore == true)
   || typeof key.identifier == "undefined") {return}
   // Duplicate identifier error.
   if (typeof keymap[key.identifier] !== "undefined") {throw "Duplicate key identifier " + key.identifier + " at keys: " + Object.keys(keys).filter(otherkey => {return keys[otherkey].identifier == key.identifier}).join(", ")}
   keymap[key.identifier] = {
      character: key.label.text,
      classes: key.classes,
      label_classes: key.label.classes,
      nokeydown: typeof key.nokeydown !== "undefined" ? key.nokeydown : false,
      toggle: typeof key.toggle !== "undefined" ? key.toggle : false,
      active: false,
      chain_active: false,
      RL: typeof key.RL == "undefined" ? false : key.RL,
      name: typeof key.name !== "undefined" ? key.name : key.label.text.toLowerCase().replace(" ", ""),
      ignore: typeof key.ignore == "undefined" ? false : key.ignore,
   }
   key.label.subtext = typeof key.label !== "undefined" && typeof key.label.subtext !== "undefined" ? key.label.subtext : ""
})
let to_add = []
let shortcuts_list = shortcuts.map(entry => {
   return create_shortcut_entry(entry)
})
function create_shortcut_entry (entry) {
   entry.shortcut = entry.shortcut.split(" ")
   entry._shortcut = entry.shortcut.map((keyset, index) => {
      let keys = keyset.replace(/(\+|-)(?=\1|[\s\S])/gm, "==BREAK==").split("==BREAK==")
      entry.shortcut[index] = _.pull(keys, '==BREAK==').join("+")
      let RL = []
      keys = keys.map(key=> {
         let match = false
         key = key.toLowerCase()
         Object.keys(keymap).map(identifier => {
            let key_set = keymap[identifier]
            if (key_set.name == key) {
               key = identifier
               match = true
            }
         })
         if (match == false) {throw "Unknown key: " + key}
         if (keymap[key].RL == true) {
            RL.push(key)
         }
         return key
      })
      if (RL.length > 0) {
         RL.map(key => {
            if (key.indexOf("Right") !== -1) {
               keys.push(key.replace("Right", "Left"))
            } else {
               keys.push(key.replace("Left", "Right"))
            }
         })
      }
      return _.pull(keys, '==BREAK==');
   })
   entry.chained = entry._shortcut.length > 1 ? true : false
   entry.chain_start = false
   if (entry.chained) {
      let shortcut = entry.shortcut.join(" ").replace(entry.shortcut[1], "")
      to_add.push({command:"Chain Start", chain_start: true, chained:false, _shortcut: [entry._shortcut[0]], shortcut: shortcut})
   }
   entry.shortcut = entry.shortcut.join(" ")
   entry.editing = false
   return entry
}
shortcuts_list = [...shortcuts_list, ...to_add]

export default {
   name: 'App',
   components: {
      Keys,
      Options,
      ShortcutsList
   },
   data() {
      return {
         options: {
            mode: "Toggle All",
            theme_dark: true,
         },
         layout: layout,
         keys: keys,
         keymap: keymap,
         modes: ["As Pressed", "Toggle Modifiers", "Toggle All"],
         mod_codes: ["ControlLeft", "ControlRight", "ShiftRight", "ShiftLeft", "AltRight", "AltLeft"],
         modifiers_order: ["ctrl", "shift", "alt"],
         special_states: ["CapsLock", "NumLock", "ScrollLock"],
         shortcuts: shortcuts_list,
         chain: {
            //allow: true,
            in_chain: false,
            start: [],
            last: [],
            warning: false,
         },
         shortcuts_active: [],
         mods_unknown: true
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
      keymap_active () {
         return Object.keys(this.keymap).filter(identifier => {
            let key = this.keymap[identifier];
            return key.active
         })
      },
      none_mods_in_active () {
         return _.intersection(this.keymap_active, this.none_mods)
      },
   },
   methods: {
      change (key, data) {
         this[key] = data
      },
      chained (data) {
         this.chain = {...this.chain, ...data}
         if (this.chain.in_chain == true) {
            for (let key of this.chain.start) {
               this.keymap[key].active = false
               this.keymap[key].chain_active = true
            }
         } else {
            for (let key of this.keymap_active) {
               this.keymap[key].active = false
               this.keymap[key].chain_active = false
            }
            for (let key of this.chain.start) {
               this.keymap[key].active = false
               this.keymap[key].chain_active = false
            }
            this.chain.last = [...this.chain.start]
            this.chain.start = []
            this.chain.shortcut = ""
            setTimeout(() => {
               this.chain.warning = false
            }, 1000);
         }
      },
      shortcut_edit({oldshortcut, newshortcut, oldcommand, newcommand}) {
         let index = this.shortcuts.findIndex(entry => entry.shortcut == oldshortcut && entry.command == oldcommand)
         let newentry = {shortcut: newshortcut, command: newcommand}
         this.$set(this.shortcuts, index, create_shortcut_entry(newentry))
         this.get_shortcuts_active()

      },
      normalize (identifiers, capitalize) {
         if (identifiers.length == 0) {return []}
         let keys = identifiers.map(keyname => {
            return this.keymap[keyname].name
         })
         keys = _.uniq(keys)
         let mods = this.mod_codes.map(keyname => {
            return this.keymap[keyname].name
         })
         let keys_mods = keys.filter(key => mods.includes(key)).sort((a,b)=>{
            return this.modifiers_order.indexOf(a) - this.modifiers_order.indexOf(b)
         })
         let keys_none_mods = _.xor(keys, keys_mods)
         keys = [...keys_mods, ...keys_none_mods]
         if (capitalize) {
            keys = keys.map(key => {
               let newkey
               for (let keyname in this.keymap) {
                  let key_set = this.keymap[keyname]
                  if (key == key_set.character.toLowerCase()) {
                     return key_set.character
                  }
               }
               throw "Can't find key character "+ key +" when normalizing."
            })
         }
         return keys
      },
      get_shortcuts_active () {
         this.shortcuts_active = this.shortcuts.filter(entry => {
            if (!this.chain.in_chain && !entry.chained) {
               if (entry.chain_start && entry._shortcut[0].length == this.keymap_active.length && _.difference(entry._shortcut[0], this.keymap_active).length == 0) {
                  this.chained({in_chain: true, start: [...this.keymap_active], shortcut: entry.shortcut, warning: false})
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
               return false
            }
         })
      },
      keydown (e) {
         let identifier = e.code
         e.preventDefault()
         e.stopPropagation()
         if (this.options.mode == "Toggle All") {
            this.keymap[identifier].active = !this.keymap[identifier].active
         } else if (this.options.mode == "Toggle Modifiers") {
            if (this.mod_codes.includes(identifier)){
               this.keymap[identifier].active = !this.keymap[identifier].active
            } else {
               this.keymap[identifier].active = this.keymap[identifier].toggle ? !this.keymap[identifier].active : true
            }
         } else {
            this.keymap[identifier].active = this.keymap[identifier].toggle ? !this.keymap[identifier].active : true
         }
         if (this.mods_unknown) {
            this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
            this.keymap["NumLock"].active = e.getModifierState("NumLock")
            this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
            this.mods_unknown = false
         } else if (this.special_states.includes(identifier)) {
            this.keymap[identifier].active = e.getModifierState(identifier)
         }
         if (keymap[identifier].RL = true) {
            if (identifier.indexOf("Right") !== -1) {
               this.keymap[identifier.replace("Right", "Left")].active = this.keymap[identifier].active
            } else {
               this.keymap[identifier.replace("Left", "Right")].active = this.keymap[identifier].active
            }
         }
         this.$emit("input", this.keymap)
      },
      keyup (e) {
         let identifier = e.code
         e.preventDefault()
         e.stopPropagation()
         if (this.keymap[identifier].nokeydown) {
            this.keymap[identifier].active = this.keymap[identifier].toggle ? !this.keymap[identifier].active : true
            this.keymap[identifier].timer = setTimeout(() => {
               this.keymap[identifier].active = this.keymap[identifier].toggle ? this.keymap[identifier].active : false
            }, 300);
         } else {
            if (this.options.mode == "Toggle Modifiers") {
               if (!this.mod_codes.includes(identifier)){
                  this.keymap[identifier].active = this.keymap[identifier].toggle ? this.keymap[identifier].active : false
               }
            } else if (this.options.mode !== "Toggle All") {
            }
            if (this.mods_unknown) {
               this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
               this.keymap["NumLock"].active = e.getModifierState("NumLock")
               this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
               this.mods_unknown = false
            } else if (this.special_states.includes(identifier)) {
               this.keymap[identifier].active = e.getModifierState(identifier)
            }
         }
         if (keymap[identifier].RL = true) {
            if (identifier.indexOf("Right") !== -1) {
               this.keymap[identifier.replace("Right", "Left")].active = this.keymap[identifier].active
            } else {
               this.keymap[identifier.replace("Left", "Right")].active = this.keymap[identifier].active
            }
         }
         this.$emit("input", this.keymap)
      }
   },
   watch: {
      "keymap_active" (newactive, oldactive) {
         if (this.chain.in_chain) {
            if (newactive.length > 1 && this.shortcuts_active.length == 0 && _.difference(newactive, this.mod_codes).length !== 0) {
               this.chained({in_chain: false, warning: [...newactive]})
            }
         }
         this.get_shortcuts_active()
      },
   },
   mounted() {
   },
}
</script>

<style lang="scss">
@import "./settings/theme.scss";

.background-light {
   background: $theme-light-background;
   .key {
      background: $cap-light-border;
   }
   .key > .dec {
      border: $cap-light-border;
   }
}
.background-dark {
   background: $theme-dark-background;
   color: invert($theme-dark-background);
   .key {
      background: $cap-dark-border;
   }
   .key > .dec{
      border: $cap-dark-border;
   }
}

body {
   margin:0;
   font-family: Arial, sans-serif;
}
</style>
