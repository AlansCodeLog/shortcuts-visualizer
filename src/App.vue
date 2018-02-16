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
         @input="change('keymap', $event)"
      ></Keys>
      <ShortcutList
         :keymap="keymap"
         :shortcuts="shortcuts"
      ></ShortcutList>
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
Object.keys(keys).map(keyname=>{
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
let shortcuts_list = shortcuts.map(entry => {
   entry._shortcut = entry.shortcut.split(" ")
   entry._shortcut = entry._shortcut.map(keyset => {
      let keys = keyset.replace(/(\+|-)(?=\1|[\s\S])/gm, "==BREAK==").split("==BREAK==")
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
         return key
      })
      return _.pull(keys, '==BREAK==');
   })
   entry.chained = entry._shortcut.length > 1 ? true : false
   return entry
})

export default {
   name: 'App',
   data() {
      return {
         options: {
            mode: "Toggle Modifiers",
            theme_dark: true,
         },
         layout: layout,
         keys: keys,
         keymap: keymap,
         modes: ["As Pressed", "Toggle Modifiers", "Toggle All"],
         mod_codes: ["ControlLeft", "ControlRight", "ShiftRight", "ShiftLeft", "AltRight", "AltLeft"],
         special_states: ["CapsLock", "NumLock", "ScrollLock"],
         shortcuts: shortcuts_list,
      }
   },
   methods: {
      change (key, data) {
         this[key] = data
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
         e.preventDefault()
         e.stopPropagation()
         if (this.options.mode == "Toggle All") {
            this.keymap[e.code].active = !this.keymap[e.code].active
         } else if (this.options.mode == "Toggle Modifiers") {
            if (this.mod_codes.includes(e.code)){
               this.keymap[e.code].active = !this.keymap[e.code].active
            } else {
               this.keymap[e.code].active = this.keymap[e.code].toggle ? !this.keymap[e.code].active : true
            }
         } else {
            this.keymap[e.code].active = this.keymap[e.code].toggle ? !this.keymap[e.code].active : true
         }
         if (mods_unknown) {
            this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
            this.keymap["NumLock"].active = e.getModifierState("NumLock")
            this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
            mods_unknown = false
         } else if (this.special_states.includes(e.code)) {
            this.keymap[e.code].active = e.getModifierState(e.code)
         }
         this.$emit("input", this.keymap)
      })
      document.addEventListener("keyup", (e) => {
         e.preventDefault()
         e.stopPropagation()
         if (this.keymap[e.code].nokeydown) {
            this.keymap[e.code].active = this.keymap[e.code].toggle ? !this.keymap[e.code].active : true
            this.keymap[e.code].timer = setTimeout(() => {
               this.keymap[e.code].active = this.keymap[e.code].toggle ? this.keymap[e.code].active : false
            }, 300);
         } else {
            if (this.options.mode == "Toggle Modifiers") {
               if (!this.mod_codes.includes(e.code)){
                  this.keymap[e.code].active = this.keymap[e.code].toggle ? this.keymap[e.code].active : false
               }
            } else if (this.options.mode !== "Toggle All") {
               this.keymap[e.code].active = this.keymap[e.code].toggle ? this.keymap[e.code].active : false
            }
            if (mods_unknown) {
               this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
               this.keymap["NumLock"].active = e.getModifierState("NumLock")
               this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
               mods_unknown = false
            } else if (this.special_states.includes(e.code)) {
               this.keymap[e.code].active = e.getModifierState(e.code)
               console.log(e.getModifierState(e.code));
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
