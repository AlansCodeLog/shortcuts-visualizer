import Vue from "vue"

export const helpers = Vue.mixin({
	methods: {
		multisplice(array, indexes) {
			for (let i = 0; i < indexes.length; i++) {
				array.splice(indexes[i] - i, 1)
			}
		},
		find_extra_modifiers(shortcut_entry) {
			return _.difference(shortcut_entry, this.keymap_active).filter(identifier => { //the order of difference matters
				if (this.keymap[identifier].is_modifier) {
					return true
				}
			})
		},
		find_extra_keys_pressed(shortcut_entry) {
			return _.difference(this.keymap_active, shortcut_entry).filter(identifier => {//the order of difference matters
				if (!shortcut_entry.includes(identifier)) {
					return true
				}
			})
		},
		get_shortcuts_active (show_unpressed_modifiers = false) {
			//params for functions used, to clean things up a bit
			return this.shortcuts.filter(entry => {
				if (!entry.contexts.includes(this.active_context)) {return false}
				if (!this.chain.in_chain && !entry.chained) {
					let extra_modifiers_in_shortcut = this.find_extra_modifiers(entry._shortcut[0])
					let extra_keys_pressed = this.find_extra_keys_pressed(entry._shortcut[0])
					
					if (extra_modifiers_in_shortcut.length > 0 && !show_unpressed_modifiers) {
						return false
					}
					if (extra_keys_pressed.length !== 0) {
						return false
					}
					return true
				} else if (!this.chain.in_chain) {
					if (show_unpressed_modifiers) {
						let extra_keys_pressed = this.find_extra_keys_pressed(entry._shortcut[0])
						
						if (extra_keys_pressed.length !== 0) {
							return false
						}
						return true
					} 
					return false
				} else if (this.chain.in_chain && entry.chained && _.isEqual(entry._shortcut[0], this.chain.start)) {
					//TODO this is almost same check as first
					let extra_modifiers_in_shortcut = this.find_extra_modifiers(entry._shortcut[1])
					let extra_keys_pressed = this.find_extra_keys_pressed(entry._shortcut[1])
					
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
		},
		chain_in_active () { //second argument is spreading this
			let chain = this.shortcuts_active.filter(entry => {
				if (!entry.chained
					&& entry.chain_start
					&& entry._shortcut[0].length == this.keymap_active.length
					&& _.difference(entry._shortcut[0], this.keymap_active).length == 0
				) {
					return true
				} else {return false}
			})
			if (chain.length > 0) {
				return {in_chain: true, start: [...this.keymap_active], shortcut: chain[0].shortcut, warning: false}
			} else {return false}
		},
		_normalize (identifiers) {
			if (identifiers.length == 0) {return []}
			let keys = identifiers.map(identifier => {
				return this.keymap[identifier].name
			})
			keys = _.uniq(keys)
			let keys_mods = keys.filter(key => {
				return this.dev_options.modifiers_order.includes(key)
			}).sort((a,b)=>{
				return this.dev_options.modifiers_order.indexOf(a) - this.dev_options.modifiers_order.indexOf(b)
			})
			let keys_none_mods = _.xor(keys, keys_mods)
			keys = [...keys_mods, ...keys_none_mods]
		
			//capitalize keys
			keys = keys.map(key => {
				for (let identifier of identifiers) {
					let key_info = this.keymap[identifier]
					if (key == key_info.name) {
						return key_info.character
					}
				}
				throw "Can't find key character "+ key +" when normalizing."
			})
			return keys
		},
		keys_from_text(shortcut) {
			// split into parts, when there's more than two there's a chain
			shortcut = shortcut.split(" ").filter(entry => entry !== "")
			//get the keys array
			//normalize the - or + separator
			//and replace name of right/left keys with generic name 
			let _shortcut = shortcut.map((keyset, index) => {
				let keys = keyset.replace(/(\+|-)(?=\1|[\s\S])/gm, "==BREAK==").split("==BREAK==")
				shortcut[index] = _.pull(keys, "==BREAK==").join("+")
				let RL = []
				keys = keys.map(key=> {
					let match = false
					key = key.toLowerCase()
					Object.keys(this.keymap).map(identifier => {
						let key_set = this.keymap[identifier]
						if (key_set.name == key) {
							key = identifier
							match = true
						}
					})
					if (match == false) {throw "Unknown key: " + key}
					if (this.keymap[key].RL == true) {
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
				return _.pull(keys, "==BREAK==")
			})
			//normalize key names and create string shortcut property
			shortcut = [this.normalize(_shortcut[0].sort()).join("+")]
			if (_shortcut.length > 1) {
				shortcut.push(this.normalize(_shortcut[1].sort()).join("+"))
			}
			return {shortcut: shortcut.join(" "), _shortcut: _shortcut}
		},
		create_keymap () {
			let keymap = {}
			Object.keys(this.keys).map(keyname=> {
				let key = this.keys[keyname]
				if (key.ignore == true || typeof key.identifier == "undefined") {return}
				
				// Duplicate identifier error.
				if (typeof keymap[key.identifier] !== "undefined") {throw "Duplicate key identifier " + key.identifier + " at keys: " + Object.keys(this.keys).filter(otherkey => {return this.keys[otherkey].identifier == key.identifier}).join(", ")}
				
				keymap[key.identifier] = {
					identifier: key.identifier,
					name: typeof key.name !== "undefined" ? key.name.toLowerCase().replace(" ", "") : key.character.toLowerCase().replace(" ", ""),
					character: typeof key.character !== "undefined" ? key.character : "",
					classes: typeof key.classes !== "undefined" ? key.classes : [],
					label_classes: typeof key.label_classes !== "undefined" ? key.label_classes : [],
					RL: typeof key.RL !== "undefined" ? key.RL : false,
					is_modifier: typeof key.is_modifier !== "undefined" ? key.is_modifier : false,
					block_alone: typeof key.block_alone !== "undefined" ? key.block_alone : false,
					block_single: typeof key.block_single !== "undefined" ? key.block_single : false,
					block_all: typeof key.block_all !== "undefined" ? key.block_all : false,
					ignore: typeof key.ignore !== "undefined" ? key.ignore : false,
					nokeydown: typeof key.nokeydown !== "undefined" ? key.nokeydown : false,
					toggle: typeof key.toggle !== "undefined" ? key.toggle : false,
					fake_toggle: typeof key.toggle !== "undefined" ? key.fake_toggle : false,
					RL: typeof key.RL !== "undefined" ? key.RL : false,
					active: false,
					chain_active: false,
				}
				if (keymap[key.identifier].is_modifier) {
					keymap[key.identifier].classes.push("modifiers")
				}
				if (keymap[key.identifier].block_alone) {
					keymap[key.identifier].classes.push("block_alone")
				} 
				if (keymap[key.identifier].block_all) {
					keymap[key.identifier].classes.push("block_all")
				} 
				if (keymap[key.identifier].block_single) {
					keymap[key.identifier].classes.push("block_single")
				}
			})
			return keymap
		},
		create_shortcuts_list (settings_shortcuts) {
			// create empty array because we might push to it more than once per entry
			let shortcuts = []
			let contexts = []
			//normalizes all the names, creates _shortcut entry, and adds chained and chained_start
			//this way create_shortcut_entry can check existing shortcuts much more cleanly
			this.ready_all(settings_shortcuts)
			
			settings_shortcuts.map(entry => {
				let new_entries = this.create_shortcut_entry(entry)
				
				if (new_entries.error) {throw new_entries.error}
				if (new_entries.remove) {
					this.multisplice(shortcuts, new_entries.remove)
				}
				shortcuts.push(new_entries.entry)
				if (new_entries.extra) {
					shortcuts.push(new_entries.extra)
				}
				for (let context of entry.contexts) {
					if (!contexts.includes(context)) {contexts.push(context.toLowerCase())}
				}
			})
			
			return {shortcuts_list: shortcuts, context_list: contexts.sort()}
		},
		ready_all(shortcuts) {
			shortcuts.map(entry =>{
				var {shortcut, _shortcut} = this.keys_from_text(entry.shortcut)
				//add to our shortcut entry
				entry.shortcut = shortcut
				entry._shortcut = _shortcut
				entry.chained = entry._shortcut.length > 1 ? true : false
				entry.chain_start = typeof entry.chain_start !== "undefined" ? entry.chain_start : false
				entry.contexts = typeof entry.contexts !== "undefined" ? entry.contexts.map(entry => entry = entry.toLowerCase()).sort() : ["global"]
				if (!Array.isArray(entry.contexts)) {
					throw "Entry contexts: " + entry.contexts + " must be an array. See shortcut: " + entry.shortcut + " for command: " + entry.command
				}
			})
		},
		create_error(index, entry, existing_entry, type, editing) {
			if (type == "Regular Error") {
				var error = {}
				error.message = "Shortcut '" + entry.shortcut + "' (command: " + entry.command +") already exists: '" + existing_entry.shortcut + "' (command: " + existing_entry.command+")"
				error.code = type
				error.index = index
			} else if (type == "Chain Error") {
				var error = {}
				error.message = "Shortcut '" + entry.shortcut + "' is the start of a chain. It cannot be overwritten for command '" + entry.command + "'. If you'd like to just change the command text, chain_start must be set to true for the shortcut."
				error.code = type
				error.index = index
			} else {
				var error = {}
				error.code = type
				error.index = index
			}
			if (!editing) {throw error} else {return error}
		},
		get_blocked_singles(modifiers) {
			
			let blocked_modifiers = []
			//set limit to check length again because we might have 2 blocked single keys pressed
			//in which case it's allowed
			//but the following function might give us an array of 2 blocked modifiers
			//which if they are right/left means we have to up the limit to 2
			let limit = 1 
			let unblocked_modifiers = modifiers.filter(keyname => {
				if (this.keymap[keyname].block_single) {
					blocked_modifiers.push(keyname)
					if (this.keymap[keyname].RL) {limit = 2}
				}
				return !this.keymap[keyname].block_single
			})
			if (blocked_modifiers.length == limit && unblocked_modifiers.length == 0) {
				return blocked_modifiers
			} else {
				return false
			}
		},
		create_shortcut_entry (entry, editing = false) {
			let invalid_shortcut = false
		
			if (typeof entry._shortcut == "undefined") {
				try { //might fail do to invalid keys
					entry.shortcut = this.keys_from_text(entry.shortcut)
				} catch (error) {
					invalid_shortcut = {}
					invalid_shortcut.message = error
					invalid_shortcut.code = "Invalid Key"
					return
				}
				entry._shortcut = entry.shortcut._shortcut
				entry.shortcut = entry.shortcut.shortcut
			}
			
			entry.chained = entry._shortcut.length > 1 ? true : false
			entry.chain_start = typeof entry.chain_start !== "undefined" ? entry.chain_start : false
		
		
			for (let keyset of entry._shortcut) {
				//get modifiers in keyset
				let modifiers = keyset.filter(key => this.keymap[key].is_modifier)

				//BLOCKED ALONE
				//blocked_alone should be checked before blocked_single
				let not_blocked_alone = []
				let blocked_alone = keyset.filter(key => {
					if (!this.keymap[key].block_alone) {
						not_blocked_alone.push(key)
					}
					return this.keymap[key].block_alone
				})
				
				if (not_blocked_alone.length == 0) {
					invalid_shortcut = {}
					invalid_shortcut.message = `Invalid shortcut ${entry.shortcut}. Shortcuts with just "${this.normalize(blocked_alone).join(", ")}" as their only key/s are blocked.`
					invalid_shortcut.code = "Blocked Alone"
					break
				}
				
				//BLOCKED SINGLE
				let blocked_singles = this.get_blocked_singles(modifiers)
				if (blocked_singles) {
					invalid_shortcut = {}
					invalid_shortcut.message = `Invalid shortcut ${entry.shortcut} Shortcuts containing only "${this.normalize(blocked_singles).join("")}" as a modifier are blocked.`
					invalid_shortcut.code = "Blocked Single"
					break
				}

				//BLOCKED ALL
				let block_all = keyset.filter(key => this.keymap[key].block_all)
				if (block_all.length > 0) {
					if (entry.chained) {
						entry._shortcut[1].map(key => {
							if (this.keymap[key].block_all) {
								block_all.push(key)
							}
						})
					}
					invalid_shortcut = {}
					invalid_shortcut.message = `Invalid shortcut " + entry.shortcut + ". Shortcuts cannot contain keys: ["${this.normalize(block_all).join(", ")}"], assignments to the keys are blocked.`
					invalid_shortcut.code = "Blocked All"
					break
				}
			}
			
			let existing_error = false
			let overwrite = false
			this.shortcuts.findIndex((existing_entry, index) => {
				if (existing_entry.shortcut == entry.shortcut) { //if the two shortcuts are exactly the same
					if (entry.chain_start == existing_entry.chain_start) { 
						if (entry.chain_start) {//if they're both chain starts
							overwrite = true
							if (editing) {existing_error = this.create_error(index, entry, existing_entry, "Overwrite", editing)}
						} else { //if they're both regular
							existing_error = this.create_error(index, entry, existing_entry, "Regular Error", editing)
						}
					} else if (existing_entry.chain_start) {//existing entry is a chain start but not new
						existing_error = this.create_error(index, existing_entry, entry, "Chain Error", editing)
					} else if (entry.chain_start) {//new entry is a chain start but not existing
						existing_error = this.create_error(index, entry, existing_entry, "Chain Error", editing)
					}
				} else if (_.isEqual(existing_entry._shortcut[0], entry._shortcut[0])) {
					if (existing_entry._shortcut.length == 1 && !existing_entry.chain_start && !existing_entry.chained) {//if existing entry should be marked as chain start but isn't
						if (!editing) {existing_error = this.create_error(index, existing_entry, entry, "Chain Error", editing)}
					} else if (entry._shortcut.length == 1 &&  !existing_entry.chain_start && !entry.chained && !entry.chain_start) {//if new entry should be marked as chain but isn't
						if (!editing) {existing_error = this.create_error(index, entry, existing_entry, "Chain Error", editing)}
					} else if (existing_entry._shortcut.length == 1 && entry._shortcut.length == 1 && !existing_entry.chain_start && !entry.chained) {//if new entry is a chain start, existing isn't and should be overwritten
						overwrite = true
						if (editing) {existing_error = this.create_error(index, entry, existing_entry, "Overwrite", editing)}
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
					shortcut: this.normalize(entry._shortcut[0]).join("+"),
					contexts: [...entry.contexts]
				}
				
				let existing_index = this.shortcuts.findIndex((existing_entry, index) => {
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

			//remove any existing chain starts so replacement can be put
			let chain_starts_to_remove = false
			if (overwrite && entry.chain_start) {
				let existing_index = []
				this.shortcuts.map((existing_entry, index) => {
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
			
			return {entry, extra: extra_entry, remove: chain_starts_to_remove, error: existing_error, invalid: invalid_shortcut}
		}
	}
})