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

export function get_shortcuts_active (_this, show_unpressed_modifiers = false) {
   
   let {shortcuts, keymap, options} = _this
   let pressed_keys = _this.keymap_active
   let chain_state = _this.chain
   //params for functions used, to clean things up a bit
   let p = {pressed_keys, keymap}
   return shortcuts.filter(entry => {
      if (!entry.contexts.includes(options.context)) {return false}
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
         if (show_unpressed_modifiers) {
            let extra_keys_pressed = find_extra_keys_pressed(entry._shortcut[0], p)
            
            if (extra_keys_pressed.length !== 0) {
               return false
            }
            return true
         } 
         return false
      } else if (chain_state.in_chain && entry.chained && _.isEqual(entry._shortcut[0], chain_state.start)) {
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
   shortcut = [_normalize(_shortcut[0].sort(), undefined, {keymap, modifiers_order, modifiers_names}).join("+")]
   if (_shortcut.length > 1) {
      shortcut.push(_normalize(_shortcut[1].sort(), undefined, {keymap, modifiers_order, modifiers_names}).join("+"))
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
   let contexts = []
   //normalizes all the names, creates _shortcut entry, and adds chained and chained_start
   //this way create_shortcut_entry can check existing shortcuts much more cleanly
   ready_all(settings_shortcuts, undefined, {keymap, modifiers_order, modifiers_names})
   settings_shortcuts.map(entry => {
      let new_entries = create_shortcut_entry(entry, undefined, {shortcuts, keymap, modifiers_order, modifiers_names})
      
      if (new_entries.error) {throw new_entries.error}
      if (new_entries.remove) {
         _.pullAt(shortcuts, new_entries.remove)
      }
      shortcuts.push(new_entries.entry)
      if (new_entries.extra) {
         shortcuts.push(new_entries.extra)
      }
      for (let context of entry.contexts) {
         if (!contexts.includes(context)) {contexts.push(context)}
      }
   })
   
   return {shortcuts_list: shortcuts, context_list: contexts}
}

export function ready_all(shortcuts, _this, {keymap, modifiers_order, modifiers_names}) {
   //setting variables from this when there's no need to override variables
   if (typeof _this !== "undefined") {
      var {shortcuts, keymap, modifiers_order, modifiers_names} = _this
   }

   shortcuts.map(entry =>{
      var {shortcut, _shortcut} = _keys_from_text(entry.shortcut, undefined, {keymap, modifiers_order, modifiers_names})
      //add to our shortcut entry
      entry.shortcut = shortcut
      entry._shortcut = _shortcut
      entry.chained = entry._shortcut.length > 1 ? true : false
      entry.chain_start = typeof entry.chain_start !== "undefined" ? entry.chain_start : false
      entry.contexts = typeof entry.contexts !== "undefined" ? entry.contexts.sort() : ["Global"]
      if (!Array.isArray(entry.contexts)) {
         throw "Entry contexts: " + entry.contexts + " must be an array. See shortcut: " + entry.shortcut + " for command: " + entry.command
      }
   })
}

function create_error(index, entry, existing_entry, type, editing) {
   if (type == "Regular Error") {
      var error = {}
      error.name = new Error("Shortcut '" + entry.shortcut + "' (command: " + entry.command +") already exists: '" + existing_entry.shortcut + "' (command: " + existing_entry.command)+")"
      error.code = type
      error.index = index
   } else if (type.indexOf("Chain Error") !== -1) {
      var error = {}
      error.name = new Error("Shortcut '" + entry.shortcut + "' is the start of a chain. It cannot be overwritten for command '" + entry.command + "'. If you'd like to just change the command text, chain_start must be set to true for the shortcut.")
      error.code = type
      error.index = index
   } else {
      var error = {}
      error.code = type
      error.index = index
   }
   if (!editing) {throw error} else {return error}
}

export function create_shortcut_entry (entry, _this, {shortcuts, keymap, modifiers_order, modifiers_names} = {}, editing = false) {
   //setting variables from this when there's no need to override variables
   if (typeof _this !== "undefined") {
      var {shortcuts, keymap, modifiers_order, modifiers_names} = _this
   }

   entry.chained = entry._shortcut.length > 1 ? true : false
   entry.chain_start = typeof entry.chain_start !== "undefined" ? entry.chain_start : false
   
   let existing_error = false
   let overwrite = false
   shortcuts.findIndex((existing_entry, index) => {
      if (existing_entry.shortcut == entry.shortcut) { //if the two shortcuts are exactly the same
         if (entry.chain_start == existing_entry.chain_start) { 
            if (entry.chain_start) {//if they're both chain starts
               overwrite = true
               if (editing) {existing_error = create_error(index, entry, existing_entry, "Overwrite", editing)}
            } else { //if they're both regular
               existing_error = create_error(index, entry, existing_entry, "Regular Error", editing)
            }
         } else if (existing_entry.chain_start) {//existing entry is a chain start but not new
            existing_error = create_error(index, existing_entry, entry, "Chain Error", editing)
         } else if (entry.chain_start) {//new entry is a chain start but not existing
            existing_error = create_error(index, entry, existing_entry, "Chain Error4", editing)
         }
      } else if (_.isEqual(existing_entry._shortcut[0], entry._shortcut[0])) {
         if (existing_entry._shortcut.length == 1 && !existing_entry.chain_start && !existing_entry.chained) {//if existing entry should be marked as chain start but isn't
            if (!editing) {existing_error = create_error(index, existing_entry, entry, "Chain Error3", editing)}
         } else if (entry._shortcut.length == 1 &&  !existing_entry.chain_start && !entry.chained && !entry.chain_start) {//if new entry should be marked as chain but isn't
         if (!editing) {existing_error = create_error(index, entry, existing_entry, "Chain Error2", editing)}
         } else if (existing_entry._shortcut.length == 1 && entry._shortcut.length == 1 && !existing_entry.chain_start && !entry.chained) {//if new entry is a chain start, existing isn't and should be overwritten
            overwrite = true
            if (editing) {existing_error = create_error(index, entry, existing_entry, "Overwrite", editing)}
         }
      }
   })

   let extra_entry = false
   
   // create chain start if entry chained and custom chain start not set
   if (entry.chained) {
      let new_entry = {
         editing: false,
         dragging: false,
         changed: false,
         command:"Chain Start",
         chain_start: true,
         chained: false,
         _shortcut: [entry._shortcut[0]],
         shortcut: _normalize(entry._shortcut[0], undefined, {keymap, modifiers_order, modifiers_names}).join("+"),
      }
      
      let existing_index = shortcuts.findIndex((existing_entry, index) => {
         if (existing_entry.chain_start && _.isEqual(existing_entry._shortcut[0], new_entry._shortcut[0])) {
            if (existing_entry.chain_start) {
               return true
            }
         }
      })
      
      let exists = existing_index == -1 ? false : true
      
      if (!exists) {
         extra_entry = new_entry
      }
   }
   if (entry.chain_start) {
      console.log("would happen if not for not editing")
   }
   
   //remove any existing chain starts so replacement can be put
   let chain_starts_to_remove = false
   if (overwrite && entry.chain_start) {
      let existing_index = []
      shortcuts.map((existing_entry, index) => {
         if (_.isEqual(existing_entry._shortcut[0], entry._shortcut[0])) {
            if (existing_entry.chain_start) {
               existing_index.push(index)
            }
         }
      })
      
      chain_starts_to_remove = existing_index.length == 0 ? false : existing_index
   }
   
   //for internal use
   entry.editing = false
   entry.changed = false
   entry.dragging = false
   
   return {entry, extra: extra_entry, remove: chain_starts_to_remove, error: existing_error}
}