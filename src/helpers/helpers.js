import * as _ from "lodash"

export function find_extra_modifiers(shortcut_entry, pressed_keys, keymap) {
   return _.difference(shortcut_entry, pressed_keys).filter(identifier => { //the order of difference matters
      if (keymap[identifier].is_modifier) {
         return true
      }
   })
}
export function find_extra_keys_pressed(shortcut_entry, pressed_keys) {
   return _.difference(pressed_keys, shortcut_entry).filter(identifier => {//the order of difference matters
      if (!shortcut_entry.includes(identifier)) {
         return true
      }
   })
}

export function get_shortcuts_active (shortcuts, pressed_keys, chain_state, keymap, show_unpressed_modifiers = false) {
   return shortcuts.filter(entry => {
      if (!chain_state.in_chain && !entry.chained) {
         let extra_modifiers_in_shortcut = find_extra_modifiers(entry._shortcut[0], pressed_keys, keymap)
         let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[0], pressed_keys)
         if (extra_modifiers_in_shortcut.length > 0 && !show_unpressed_modifiers) {
            return false
         }
         if (extra_keys_pressed.length !== 0) {
            return false
         }
         return true
      } else if (!chain_state.in_chain) {
         let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[1], pressed_keys)
         if (extra_keys_pressed == 0 && !show_unpressed_modifiers) {
            return true
         }
      } else if (chain_state.in_chain && entry.chained) {
         let extra_modifiers_in_shortcut = find_extra_modifiers(entry._shortcut[1], pressed_keys, keymap)
         if (extra_modifiers_in_shortcut.length > 0 && !show_unpressed_modifiers) {
            return false
         }
         let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[1], pressed_keys)
         if (extra_keys_pressed.length !== 0) {
            return false
         }
         return true
      } else {
         return false
      }
   })
}

export function chain_in_active (shortcuts_active, pressed_keys) {
   let chain = shortcuts_active.filter(entry => {
      if (!entry.chained
         && entry.chain_start
         && entry._shortcut[0].length == pressed_keys.length
         && _.difference(entry._shortcut[0], pressed_keys).length == 0
      ) {
         return true
      } else {return false}
   })
   if (chain.length > 0) {
      return {in_chain: true, start: [...pressed_keys], shortcut: chain[0].shortcut, warning: false}
   } else {return false}
}

function _normalize (modifiers_order, modifiers_names, keymap, identifiers, capitalize) {
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
   if (capitalize) {
      keys = keys.map(key => {
         for (let identifier of identifiers) {
            let key_info = keymap[identifier]
            if (key == key_info.name) {
               return key_info.character
            }
         }
         throw "Can't find key character "+ key +" when normalizing."
      })
   }
   return keys
}
export const normalize = _normalize

function _keys_from_text(shortcut, keymap, modifiers_order, modifiers_names) {
   shortcut = shortcut.split(" ").filter(entry => entry !== "")
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
   shortcut = [_normalize(modifiers_order, modifiers_names, keymap, _shortcut[0], true).join("+")]
   if (_shortcut.length > 1) {
      shortcut.push(_normalize(modifiers_order, modifiers_names, keymap, _shortcut[1], true).join("+"))
   }
   return {shortcut: shortcut.join(" "), _shortcut: _shortcut, original: shortcut}
}

export const keys_from_text = _keys_from_text

export function create_shortcut_entry (entry, shortcuts_list, keymap, modifiers_order, modifiers_names, editing = false, check_exists = true) {
   let {shortcut, _shortcut, original} = _keys_from_text(entry.shortcut, keymap, modifiers_order, modifiers_names)
   entry.shortcut = shortcut
   entry._shortcut = _shortcut
   //check it doesn't already exist
   if (check_exists) {
      shortcuts_list.map(existing_entry => {
         if (_.isEqual(existing_entry._shortcut, entry._shortcut)) {
            //TODO allow context exception
            throw new Error("Shortcut '" + entry.shortcut.join(" ") + "' (command: " + entry.command +") already exists: '" + existing_entry.shortcut + "' (command: " + entry.command)+")"
         }
      })
   }
   //handle chains
   entry.chained = entry._shortcut.length > 1 ? true : false
   entry.chain_start = typeof entry.chain_start !== "undefined" ? entry.chain_start : false
   //check for shortcuts that override chain start or change text
   if (entry.chained) {
      let newentry = {command:"Chain Start", chain_start: true, chained:false, _shortcut: [entry._shortcut[0]], shortcut: shortcut}
      let exists = shortcuts_list.findIndex(entry => {
         if (_.isEqual(entry._shortcut[0], newentry._shortcut[0])) {
            if (entry.chain_start == newentry.chain_start) {
               return true
            } else {
               throw new Error("Shortcut " + newentry.shortcut + "' (command: " + entry.command +") is the start of a chain. It cannot be overwritten. If you'd like to just change the command text, chain_start must be set to true for the shortcut.")
            }
         }
      })
      console.log(exists);
      exists = exists == -1 ? false : true
      if (!exists) {
         shortcuts_list.push(newentry)
      }
   }
   entry.editing = false
   return entry
}

export function create_shortcuts_list (settings_shortcuts, keymap, modifiers_order, modifiers_names) {
   let shortcuts_list = []
   settings_shortcuts.map(entry => {
      shortcuts_list.push(create_shortcut_entry(entry, shortcuts_list, keymap, modifiers_order, modifiers_names))
   })
   return shortcuts_list
}
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
