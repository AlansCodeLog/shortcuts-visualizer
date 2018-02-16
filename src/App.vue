<template>
   <div
      id="app"
      :class="[{keyboard: true}, options.theme_dark ? 'background-dark' : 'background-light']"
   >
      <Options
         :options="options"
         :modes="modes"
         @input="change('options', $event)"
      ></Options>
      <Keys
         :options="options"
         :modes="modes"
         :keys="keys"
         :keymap="keymap"
         :layout="layout"
         :shortcuts="shortcuts"
         :chain="chain"
         :mod_codes="mod_codes"
         @input="change('keymap', $event)"
         @chained="chained($event)"
      ></Keys>
      <!-- <ShortcutList
         :keymap="keymap"
         :shortcuts="shortcuts"
      ></ShortcutList> -->
      <div v-if="chain.in_chain">Waiting on chain: {{chain.shortcut}}</div>
   </div>
</template>

<script>
import Keys from "./components/keys"
import Options from "./components/options"
import ShortcutList from "./components/shortcut_list"

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
      RL: typeof key.RL == "undefined" ? false : key.RL
   }
   key.alternatives = typeof key.alternatives == "undefined" ? [] : key.alternatives
   key.label.subtext = typeof key.label !== "undefined" && typeof key.label.subtext !== "undefined" ? key.label.subtext : ""

   let keynames_list = [key.label.text.toLowerCase(), key.label.subtext.toLowerCase(), keyname.toLowerCase(),key.identifier.toLowerCase(), ...key.alternatives]

   keynames_list = _.uniq(keynames_list)
   keynames[key.identifier] = keynames_list.filter(keyname => {
         if (keyname !== "") {
            return keyname.replace(/(\s)+/g, "")
         }
      }) 
})
let to_add = []
let shortcuts_list = shortcuts.map(entry => {
   entry.shortcut = entry.shortcut.split(" ")
   entry._shortcut = entry.shortcut.map((keyset, index) => {
      let keys = keyset.replace(/(\+|-)(?=\1|[\s\S])/gm, "==BREAK==").split("==BREAK==")
      entry.shortcut[index] = _.pull(keys, '==BREAK==').join("+")
      let RL = []
      keys = keys.map(key=> {
         let match = false
         key = key.toLowerCase()
         Object.keys(keynames).map(identifier => {
            let keyname = keynames[identifier]
            if (keyname.includes(key)) {
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
   return entry
})
shortcuts_list = [...shortcuts_list, ...to_add]

export default {
   name: 'App',
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
         special_states: ["CapsLock", "NumLock", "ScrollLock"],
         shortcuts: shortcuts_list,
         chain: {
            //allow: true,
            in_chain: false,
            start: [],
            shortcut: ""
         }
      }
   },
   methods: {
      change (key, data) {
         this[key] = data
      },
      chained (data) {
         this.chain.in_chain = data.in_chain
         this.chain.start = data.start
         this.chain.shortcut = data.shortcut
         for (let key of this.chain.start) {
            this.keymap[key].active = false
            this.keymap[key].chain_active = true
         }
      }  
   },
   components: {
      Keys,
      Options,
      ShortcutList
   },
   mounted() {
      let mods_unknown = true
      document.addEventListener("keydown", (e) => {
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
         if (mods_unknown) {
            this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
            this.keymap["NumLock"].active = e.getModifierState("NumLock")
            this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
            mods_unknown = false
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
      })
      document.addEventListener("keyup", (e) => {
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
            if (mods_unknown) {
               this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
               this.keymap["NumLock"].active = e.getModifierState("NumLock")
               this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
               mods_unknown = false
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
      })
   }
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
