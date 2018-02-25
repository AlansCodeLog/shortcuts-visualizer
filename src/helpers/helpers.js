import * as _ from "lodash"

export function find_extra_modifiers(shortcut_entry, {pressed_keys, keymap}) {
   return _.difference(shortcut_entry, pressed_keys).filter(identifier => { //the order of difference matters
      if (keymap[identifier].is_modifier) {
         return true
      }
   })
   
}
export function find_extra_keys_pressed(shortcut_entry, {pressed_keys}) {
   return _.difference(pressed_keys, shortcut_entry).filter(identifier => {//the order of difference matters
      if (!shortcut_entry.includes(identifier)) {
         return true
      }
   })
}

export function get_shortcuts_active (shortcuts, pressed_keys, chain_state, keymap, show_unpressed_modifiers = false) {
   //params for functions used, to clean things up a bit
   let p = {pressed_keys, keymap}
   return shortcuts.filter(entry => {
      if (!chain_state.in_chain && !entry.chained) {
         let extra_modifiers_in_shortcut = find_extra_modifiers(entry._shortcut[0], p)
         let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[0], p)
         
         if (extra_modifiers_in_shortcut.length > 0 && !show_unpressed_modifiers) {
            return false
         }
         if (extra_keys_pressed.length !== 0) {
            return false
         }
         return true
      } else if (!chain_state.in_chain) {
         if (!show_unpressed_modifiers) {
            let extra_modifiers_in_shortcut = find_extra_modifiers(entry._shortcut[0], p)
            let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[0], p)
            if (extra_modifiers_in_shortcut.length > 0) {
               return false
            }
            if (extra_keys_pressed.length !== 0) {
               return false
            }
         } else {
            // let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[1], p)
            // let extra_modifiers_in_shortcut = find_extra_modifiers(entry._shortcut[1], p)
            // console.log(extra_keys_pressed, extra_modifiers_in_shortcut)
            
            // if (extra_keys_pressed == 0) {
               return true
            // }
         }
      } else if (chain_state.in_chain && entry.chained) {
         //TODO this is almost same check as first
         let extra_modifiers_in_shortcut = find_extra_modifiers(entry._shortcut[1], p)
         let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[1], p)
         
         if (extra_modifiers_in_shortcut.length > 0 && !show_unpressed_modifiers) {
            return false
         }
         if (extra_keys_pressed.length !== 0) {
            return false
         }
         return true
      } else {
         return false
      }
   })
}

export function chain_in_active (keys_pressed, {shortcuts_active}) { //second argument is spreading this
   let chain = shortcuts_active.filter(entry => {
      if (!entry.chained
         && entry.chain_start
         && entry._shortcut[0].length == keys_pressed.length
         && _.difference(entry._shortcut[0], keys_pressed).length == 0
      ) {
         return true
      } else {return false}
   })
   if (chain.length > 0) {
      return {in_chain: true, start: [...keys_pressed], shortcut: chain[0].shortcut, warning: false}
   } else {return false}
}

function _normalize (identifiers, _this, {keymap, modifiers_order, modifiers_names}  = {}) {
   //setting variables from this when there's no need to override variables
   if (typeof _this !== "undefined") {
      var {keymap, modifiers_order, modifiers_names} = _this
   }
   if (identifiers.length == 0) {return []}
   let keys = identifiers.map(identifier => {
      return keymap[identifier].name
   })
   keys = _.uniq(keys)
   let keys_mods = keys.filter(key => {
      return modifiers_names.includes(key)
   }).sort((a,b)=>{
      return modifiers_order.indexOf(a) - modifiers_order.indexOf(b)
   })
   let keys_none_mods = _.xor(keys, keys_mods)
   keys = [...keys_mods, ...keys_none_mods]

   //capitalize keys
   keys = keys.map(key => {
      for (let identifier of identifiers) {
         let key_info = keymap[identifier]
         if (key == key_info.name) {
            return key_info.character
         }
      }
      throw "Can't find key character "+ key +" when normalizing."
   })
   return keys
}
export const normalize = _normalize

function _keys_from_text(shortcut, _this, {keymap, modifiers_order, modifiers_names} = {}) {
   //setting variables from this when there's no need to override variables
   if (typeof _this !== "undefined") {
      var {keymap, modifiers_order, modifiers_names} = _this
   }
   // split into parts, when there's more than two there's a chain
   shortcut = shortcut.split(" ").filter(entry => entry !== "")
   //get the keys array
   //normalize the - or + separator
   //and replace name of right/left keys with generic name 
   let _shortcut = shortcut.map((keyset, index) => {
      let keys = keyset.replace(/(\+|-)(?=\1|[\s\S])/gm, "==BREAK==").split("==BREAK==")
      shortcut[index] = _.pull(keys, '==BREAK==').join("+")
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
   //normalize key names and create string shortcut property
   shortcut = [_normalize(_shortcut[0], undefined, {keymap, modifiers_order, modifiers_names}).join("+")]
   if (_shortcut.length > 1) {
      shortcut.push(_normalize(_shortcut[1], undefined, {keymap, modifiers_order, modifiers_names}).join("+"))
   }
   return {shortcut: shortcut.join(" "), _shortcut: _shortcut}
}

export const keys_from_text = _keys_from_text

export function create_keymap (keys) {
   let keymap = {}
   Object.keys(keys).map(keyname=> {
      let key = keys[keyname]
      if (key.ignore == true || typeof key.identifier == "undefined") {return}
      
      // Duplicate identifier error.
      if (typeof keymap[key.identifier] !== "undefined") {throw "Duplicate key identifier " + key.identifier + " at keys: " + Object.keys(keys).filter(otherkey => {return keys[otherkey].identifier == key.identifier}).join(", ")}
      
      keymap[key.identifier] = {
         identifier: key.identifier,
         name: typeof key.name !== "undefined" ? key.name.toLowerCase().replace(" ", "") : key.character.toLowerCase().replace(" ", ""),
         character: typeof key.character !== "undefined" ? key.character : "",
         classes: typeof key.classes !== "undefined" ? key.classes : [],
         label_classes: typeof key.label_classes !== "undefined" ? key.label_classes : [],
         RL: typeof key.RL !== "undefined" ? key.RL : false,
         is_modifier: typeof key.is_modifier !== "undefined" ? key.is_modifier : false,
         ignore: typeof key.ignore !== "undefined" ? key.ignore : false,
         nokeydown: typeof key.nokeydown !== "undefined" ? key.nokeydown : false,
         toggle: typeof key.toggle !== "undefined" ? key.toggle : false,
         fake_toggle: typeof key.toggle !== "undefined" ? key.fake_toggle : false,
         RL: typeof key.RL !== "undefined" ? key.RL : false,
         active: false,
         chain_active: false,
      }
      
   })
   return keymap
}

export function create_shortcuts_list (settings_shortcuts, keymap, modifiers_order, modifiers_names) {
   // create empty array because we might push to it more than once per entry
   let shortcuts = []
   settings_shortcuts.map(entry => {
      shortcuts.push(create_shortcut_entry(entry, undefined, {shortcuts, keymap, modifiers_order, modifiers_names}))
   })
   return shortcuts
}

export function create_shortcut_entry (entry, _this, {shortcuts, keymap, modifiers_order, modifiers_names} = {}, check_exists = false, editing = false, existing_entry = false) {
   //setting variables from this when there's no need to override variables
   if (typeof _this !== "undefined") {
      var {shortcuts, keymap, modifiers_order, modifiers_names} = _this
   }
   if (!existing_entry) {
      
      // spread results from _keys_from_text
      var {shortcut, _shortcut} = _keys_from_text(entry.shortcut, undefined, {keymap, modifiers_order, modifiers_names})
      //add to our shortcut entry
      entry.shortcut = shortcut
      entry._shortcut = _shortcut
   } //else they already exist

   //check if chained or start of chain
   entry.chained = entry._shortcut.length > 1 ? true : false
   entry.chain_start = typeof entry.chain_start !== "undefined" ? entry.chain_start : false
   
   if (check_exists) {
      
      shortcuts.map(existing_entry => {
         if (existing_entry.shortcut == entry.shortcut) {
            //TODO allow context exception
            if (existing_entry.chain_start) {
               //replace chain start if replacement chain_start is true, otherwise through chain overwrite error
               if (!entry.chain_start) {
                  throw new Error("Shortcut '" + existing_entry.shortcut + "' (command: " + existing_entry.command +") is the start of a chain. It cannot be overwritten for command '" + entry.command + "'. If you'd like to just change the command text, chain_start must be set to true for the shortcut.")
               }
            } else {
               throw new Error("Shortcut '" + entry.shortcut + "' (command: " + entry.command +") already exists: '" + existing_entry.shortcut + "' (command: " + existing_entry.command)+")"
            }
         }
      })
   }
   
   //create chain start if entry chained and custom chain start not set
   //
   if (entry.chained) {
      let new_entry = {
         command:"Chain Start",
         chain_start: true,
         chained: false,
         _shortcut: [entry._shortcut[0]],
         shortcut: _normalize(entry._shortcut[0], undefined, {keymap, modifiers_order, modifiers_names}).join("+")
      }
      
      let existing_index = shortcuts.findIndex(existing_entry => {
         //find entries that should be chain starts
         if (existing_entry._shortcut.length == 1 && existing_entry.shortcut.split(" ")[0] == new_entry.shortcut.split(" ")[0]) {
            if (existing_entry.chain_start) {
               return true
            } else {
               //order/variables might seem weird, but from the user's perspective, it's the new_entry that already "exists" if they did not set the existing_entry's chain_start: true
               throw new Error("Shortcut '" + new_entry.shortcut + "' (command: " + new_entry.command +") is the start of a chain. It cannot be overwritten for command '" + existing_entry.command + "'. If you'd like to just change the command text, chain_start must be set to true for the shortcut.")
            }
         }
      })
      let exists = existing_index == -1 ? false : true
      
      if (!exists) {
         shortcuts.push(new_entry)
      }
   }
   //remove any existing chain starts so replacement can be put
   if (entry.chain_start && !editing) {
      let existing_index = shortcuts.findIndex(existing_entry => {
         if (existing_entry.shortcut.split(" ")[0] == entry.shortcut.split(" ")[0]) {
            if (existing_entry.chain_start == entry.chain_start) {
               return true
            } else {
               throw new Error("Should not throw")
            }
         }
      })
      shortcuts.splice(existing_index, 1)
   }
   
   //for internal use
   entry.editing = false
   
   return entry
}