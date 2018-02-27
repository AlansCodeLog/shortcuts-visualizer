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
         :normalize="normalize"
         :modifiers_names="modifiers_names"
         :modifiers_order="modifiers_order"
         :shortcuts="shortcuts"
         @keydown="keydown($event)"
         @keyup="keyup($event)"
         @chained="chained($event)"
         @edit="shortcut_edit($event)"
      ></Keys>
      <ShortcutsList
         :chain="chain"
         :keymap="keymap"
         :shortcuts="shortcuts"
         :modifiers_names="modifiers_names"
         :modifiers_order="modifiers_order"
         :shortcuts_active="shortcuts_list_active"
         :normalize="normalize"
         :options="options"
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
import {shortcuts as settings_shortcuts} from "./settings/shortcuts.js"

import * as _ from "lodash"
import {find_extra_modifiers, find_extra_keys_pressed, chain_in_active, get_shortcuts_active, create_shortcut_entry, create_shortcuts_list, create_keymap, normalize, keys_from_text} from "./helpers/helpers"

let keymap = create_keymap(keys)
let modifiers_names = _.uniq(Object.keys(keymap).filter(identifier => keymap[identifier].is_modifier).map(identifier => keymap[identifier].name))
let modifiers_order = ["ctrl", "shift", "alt"]

let shortcuts_list = create_shortcuts_list(settings_shortcuts, keymap, modifiers_order, modifiers_names, this)

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
            accept_on_blur: true,
         },
         layout: layout,
         keys: keys,
         keymap: keymap,
         modes: ["As Pressed", "Toggle Modifiers", "Toggle All"],
         modifiers_names: modifiers_names,
         modifiers_order: modifiers_order,
         shortcuts: shortcuts_list,
         chain: {
            //allow: true,
            in_chain: false,
            start: [],
            last: [],
            warning: false,
         },
         mods_unknown: true,
      }
   },
   computed: {
      keymap_active () {
         return Object.keys(this.keymap).filter(identifier => {
            let key = this.keymap[identifier];
            return key.active
         })
      },
      shortcuts_active () {
         return get_shortcuts_active (this.shortcuts, this.keymap_active, this.chain, this.keymap, false)
      },
      shortcuts_list_active () {
         return get_shortcuts_active (this.shortcuts, this.keymap_active, this.chain, this.keymap, true)
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
      shortcut_edit({old_entry, new_entry, flip = false}) {
         new_entry._shortcut = typeof new_entry._shortcut !== "undefined"
            ? new_entry._shortcut
            : keys_from_text(new_entry.shortcut, this)._shortcut
         let index = this.shortcuts.findIndex(entry => entry.shortcut == old_entry.shortcut) //todo same context
         //if we changed a chain or chain start to something else, create_shortcut won't know that
         if (new_entry._shortcut.length > 1) {
            new_entry.chained = true
         } else {
            new_entry.chained = false
         }
         if (!new_entry.chained && this.shortcuts.findIndex(entry => _.xor(entry._shortcut[0] == new_entry._shortcut[0]).length == 0) !== -1) {
            new_entry.chain_start = true
         } else {
            new_entry.chain_start = false
         }
         

         //in case we just swap the shortcuts our references will get messed up
         let old_old_entry = {...old_entry}
         let new_new_entry = {...new_entry}

         //we don't need to check_exists if the old and new entries are the same
         let check_exists = new_entry.shortcut == old_entry.shortcut ? false : true
         
         //if a shortcut exists, all we need to do is swap the command
         if (check_exists) {
            var new_shortcut_exists = false
            let existing = this.shortcuts.findIndex(entry => entry.shortcut == new_entry.shortcut)
            new_shortcut_exists = existing !== -1 ? true : false
            if (new_shortcut_exists) {
               let entry_swap = this.shortcuts[existing]
               if (flip) {

                  //not getting flipped?
                  let old = {...old_entry}
                  let swap = {...entry_swap}
                  entry_swap.shortcut = old.shortcut
                  old_entry.shortcut = swap.shortcut
                  entry_swap._shortcut = old._shortcut
                  old_entry._shortcut = swap._shortcut
                  entry_swap.chain_start = old.chain_start
                  old_entry.chain_start = swap.chain_start
                  entry_swap.chained = old.chained
                  old_entry.chained = swap.chained
                  this.shortcut_edit_success([old_entry, entry_swap])
               } else {
                  let old = {...old_entry}
                  let swap = {...entry_swap}
                  entry_swap.command = old.command
                  old_entry.command = swap.command
                  entry_swap.chain_start = old.chain_start
                  old_entry.chain_start = swap.chain_start
                  entry_swap.chained = old.chained
                  old_entry.chained = swap.chained
                  this.shortcut_edit_success([old_entry, entry_swap])
                  console.log(entry_swap, old_old_entry)
                  
               }
            }
         }
            
         if (!new_shortcut_exists) {
            new_entry = create_shortcut_entry (new_entry, this, undefined, false, false, true)
            new_new_entry = new_entry //just updating, it never gets swapped if we're here

            for (let prop of Object.keys(old_entry)) {
               if (typeof new_entry[prop] !== "undefined") {
                  old_entry[prop] = new_entry[prop]
               }
               
            }
            this.shortcut_edit_success([new_entry])
         }
         
         // if the old entry was chained, we might have to do some cleanup
         if (old_old_entry.chained) {
            let old_entry = old_old_entry
            let index_chain_start = this.shortcuts.findIndex(entry => entry.chain_start && _.xor(entry._shortcut[0],old_entry._shortcut[0]).length == 0)
            //sometimes the chain start might not exist because we just changed it
            
            if (index_chain_start !== -1) {
               let chain_count = this.shortcuts.reduce((count, entry) => {
                  
                  if (!entry.chain_start && _.xor(entry._shortcut[0], old_entry._shortcut[0]).length == 0) {
                     return count + 1
                  } else {return count + 0}
               }, 0)
               //if there are no other chains dependent on chain start, remove it
               if (chain_count == 0) {
                  this.shortcuts.splice(index_chain_start, 1)
               }
            }
         }
         
         
         if (old_old_entry.chain_start) {
            let old_entry = old_old_entry
            let new_entry = new_new_entry
            
            let chains = this.shortcuts.filter(entry => {
               if (entry.chained && _.xor(old_entry._shortcut[0], entry._shortcut[0]).length == 0) {
                  return entry
               }
            })
            
            for (let _oldentry of chains) {
               
               let _newshortcut = new_entry.shortcut + " " + normalize(_oldentry._shortcut[1], this).join("+")
               
               let otherchange = {
                  old_entry: _oldentry,
                  new_entry: {
                     shortcut: _newshortcut,
                     command: _oldentry.command,
                  }
               }
               
               this.shortcut_edit(otherchange)
            }
         }
         
         // if (old_entry.chain_start) {//the swap
         //    let old_entry = old_old_entry
         //    let new_entry = new_new_entry
            
         //    let chains = this.shortcuts.filter(entry => {
         //       if (entry.chained && _.xor(new_entry._shortcut[0], entry._shortcut[0]).length == 0) {
         //          return entry
         //       }
         //    })
         //    console.log(chains)
            
         //    for (let _oldentry of chains) {
         //       console.log(_oldentry)
               
         //       let _newshortcut = old_entry.shortcut + " " + normalize(_oldentry._shortcut[1], this).join("+")
               
         //       let otherchange = {
         //          old_entry: _oldentry,
         //          new_entry: {
         //             shortcut: _newshortcut,
         //             command: _oldentry.command,
         //          }
         //       }
               
         //       this.shortcut_edit(otherchange)
         //    }
         // }
      },
      shortcut_edit_success(entries) {
         entries.map(entry => {
            entry.changed = true 
            setTimeout(() => {
               entry.changed = false
            }, 300);
         })
      },
      normalize (identifiers) {
         return normalize(identifiers, this)
      },
      keydown (e) {
         let identifier = e.code
         e.preventDefault()
         e.stopPropagation()
         if (this.options.mode == "Toggle All") {
            this.keymap[identifier].active = !this.keymap[identifier].active
         } else if (this.options.mode == "Toggle Modifiers") {
            if (this.keymap[identifier].is_modifier){
               this.keymap[identifier].active = !this.keymap[identifier].active
            } else {
               this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? !this.keymap[identifier].active : true
            }
         } else {
            this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? !this.keymap[identifier].active : true
         }
         if (this.mods_unknown) {
            this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
            this.keymap["NumLock"].active = e.getModifierState("NumLock")
            this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
            this.mods_unknown = false
         } else if (this.keymap[identifier].toggle) {
            this.keymap[identifier].active = e.getModifierState(identifier)
         }
         if (keymap[identifier].RL == true) {
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
            this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? !this.keymap[identifier].active : true
            this.keymap[identifier].timer = setTimeout(() => {
               this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? this.keymap[identifier].active : false
            }, 300);
         } else {
            if (this.options.mode == "Toggle Modifiers") {
               if (!this.keymap[identifier].is_modifier){
                  this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? this.keymap[identifier].active : false
               }
            } else if (this.options.mode !== "Toggle All") {
            }
            if (this.mods_unknown) {
               this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
               this.keymap["NumLock"].active = e.getModifierState("NumLock")
               this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
               this.mods_unknown = false
            } else if (this.keymap[identifier].toggle) {
               this.keymap[identifier].active = e.getModifierState(identifier)
            }
         }
         if (keymap[identifier].RL == true) {
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
      "keymap_active" (newactive, oldactive) { //checks chain state
         if (this.chain.in_chain) {
            let none_modifiers_pressed = newactive.filter(identifier => !this.keymap[identifier].is_modifier).length > 0 ? true : false
            //is there are keys being pressed that aren't modifiers that have not shortcuts
            if (newactive.length > 0 && none_modifiers_pressed && this.shortcuts_active.length == 0) {
               this.chained({in_chain: false, warning: [...newactive]})
            }
         } else {
            let trigger_chain = chain_in_active(newactive, this)
            if (trigger_chain) {
               this.chained(trigger_chain)
            }
         }
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
   .key > .dec {
      background: $cap-light;
      border: (0.1 * $keyboard-font-size) solid  mix($cap-light, black, 90%);
      box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-light, black, 50%);
   }
}
.background-dark {
   background: $theme-dark-background;
   color: invert($theme-dark-background);
   .key .dec {
      background: $cap-dark;
      border: (0.1 * $keyboard-font-size) solid mix($cap-dark, black, 90%);
      box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-dark, black, 50%);
   }
}

body {
   margin:0;
}

#app {
   font-family: Arial, sans-serif;
}

</style>
