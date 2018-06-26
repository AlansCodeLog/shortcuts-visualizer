export default {
	methods: {
		init(options) {
			let process = this.init_process_options(options)
			//note properties won't be reactive sometimes if they aren't cloned/copied, that's why all the clone deep
			//also we don't want to modify the parent props, all modifications should be emitted up.

			if (process.keys) {
				let result = this.create_keymap(this.keys_list)
				this.keys = result.keys
				this.keymap = result.keymap
				this.modifiers_names = this.dedupe_presorted(
					Object.keys(this.keymap)
						.filter(identifier => this.keymap[identifier].is_modifier)
						.map(identifier => this.keymap[identifier].identifier)
						.sort()
				)
			}

			if (process.shortcuts || process.keys) {
				//var because we need it outside of this if statement later
				var lists = this.create_shortcuts_list(this.shortcuts_list)
			}
			
			if (process.shortcuts) {
				this.contexts_info = lists.contexts_info
			}
			if (process.contexts) {
				this.active_context = this.dev_options.default_context
			}
			
			if (this.modifiers_order == undefined
				|| this.modifiers_order.length == 0) {
					
				this.modifiers_order = this.dedupe_presorted(
					this.modifiers_names.map(identifier => this.keymap[identifier].character).sort()
				)
			}
			if (process.shortcuts || process.keys) {
				this.shortcuts = lists.shortcuts_list
				this.$emit("ready", {shortcuts_list: this.shortcuts.map(entry => this.deep_clone_entry(entry))})
			}
		},
		//init helpers
		init_process_options (options) {
			let option_keys = ["keys", "shortcuts", "contexts"]
			options.all = options.all !== undefined ? options.all : false
			option_keys.map(key => {
				if (options[key] == undefined) {
					options[key] = options.all
				}
			})
			return options
		},
		//for devs
		refresh_options(dev_options) {
			let options_keys = {
				keys_list: "keys",
				shortcuts_list: "shortcuts",
			}

			let init_options = {}
			dev_options.map(dev_key => {
				let key = options_keys[dev_key]
				if (key) {
					init_options[key] = true
				}
			})
			
			this.init(init_options)
		},
		//functions for verifying/creating shortcuts/keys/keymaps, some also used elsewhere
		create_keymap (keys_list) {
			let keymap = {}
			let keys = {}
			Object.keys(keys_list).map(keyname=> {
				let key = keys_list[keyname]
				
				let entry = {
					identifier: key.identifier,
					character: key.character ||  "",
					classes: key.classes !== undefined ? key.classes.concat() : [],
					label_classes: key.label_classes !== undefined ? key.label_classes.concat() : [],
					RL: key.RL || false,
					is_modifier: key.is_modifier || false,
					block_alone: key.block_alone || false,
					block_single: key.block_single || false,
					block_all:  key.block_all || false,
					ignore: key.ignore || false,
					nokeydown: key.nokeydown || false,
					toggle: key.toggle || false,
					fake_toggle: key.fake_toggle || false,
					RL: key.RL || false,
					active: false,
					chain_active: false,
				}
				if (key.name !== undefined) {
					entry.name = key.name.toLowerCase().replace(" ", "")
				} else {
					entry.name = entry.character.toLowerCase().replace(" ", "")
				}

				if (entry.is_modifier) {
					entry.classes.push("modifiers")
				}
				if (entry.block_alone) {
					entry.classes.push("block_alone")
				} 
				if (entry.block_all) {
					entry.classes.push("block_all")
				} 
				if (entry.block_single) {
					entry.classes.push("block_single")
				}
				//keys get added to keys regardless of any errors
				keys[keyname] = entry

				if (key.ignore == true || typeof key.identifier == "undefined") {
					return
				}
				
				// Duplicate identifier error.
				if (keymap[key.identifier] !== undefined) {
					throw "Duplicate key identifier " + key.identifier + " at keys: " + Object.keys(keys).filter(otherkey => {return keys[otherkey].identifier == key.identifier}).join(", ")
				}
				//keys don't get added to keymap unless they pass without errors
				keymap[key.identifier] = entry
			})
			return {keymap, keys}
		},
		create_shortcuts_list (settings_shortcuts) {
			// create empty array because we might push to it more than once per entry
			let shortcuts = []
			let contexts_info = {}
			//normalizes all the names, creates _shortcut entry, and adds chained and chained_start
			//this way create_shortcut_entry can check existing shortcuts much more cleanly
			this.ready_all(settings_shortcuts)
			
			settings_shortcuts.map(entry => {
				let new_entries = this.create_shortcut_entry(this.deep_clone_entry(entry), false, shortcuts)
				
				if (new_entries.error) {throw new_entries.error}
				if (new_entries.remove) {
					this.multisplice(shortcuts, new_entries.remove)
				}
				shortcuts.push(new_entries.entry)
				if (new_entries.extra) {
					shortcuts.push(new_entries.extra)
				}
				for (let context of entry.contexts) {
					if (contexts_info[context] == undefined) {
						contexts_info[context.toLowerCase()] = {count: 1}
					} else{
						contexts_info[context].count += 1
					}
				}
			})
			let ordered_binned = []

			shortcuts.map((entry, index) => {
				//adds index property to all shortcuts
				entry.index = index
				//if entry was binned, check it has holder and push it's group to ordered bin
				if (entry.binned) {
					ordered_binned.push(shortcuts.filter(entry => {
						if (entry.binned) {
							if (entry.holder !== undefined) {
								return true
							} else {
								throw "Shortcut list contains binned entries that have no holder index."
							}
						} else if (entry.holder !== undefined) {
							return true
						}
					}))
				}
			})
			// the holders of these sets might be all over the place (e.g. 2, 5, 100)
			// so here we reset them just so it doesn't get out of hand (e.g. 2, 5, 100 => 0, 1, 2)
			for (let set of ordered_binned) {
				set.map(entry => entry.holder = this.bin_holder_index)
				this.bin_holder_index += 1
			}
			
			return {shortcuts_list: shortcuts, contexts_info: contexts_info}
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
		create_shortcut_entry (entry, editing = false, existing_shortcuts = this.shortcuts) {

			entry.binned = entry.binned || false

			let invalid_shortcut = false
		
			if (typeof entry._shortcut == "undefined") {
				try { //might fail do to invalid keys
					entry.shortcut = this.keys_from_text(entry.shortcut)
				} catch (error) {
					invalid_shortcut = {}
					invalid_shortcut.message = error
					invalid_shortcut.code = "Invalid Key"
					return {invalid: invalid_shortcut}
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
			existing_shortcuts.findIndex((existing_entry, index) => {
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
				} else if (this.is_equal(existing_entry._shortcut[0], entry._shortcut[0])) {
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
				
				let existing_index = existing_shortcuts.findIndex((existing_entry, index) => {
					if (existing_entry.chain_start && this.is_equal(existing_entry._shortcut[0], new_entry._shortcut[0])) {
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
				existing_shortcuts.map((existing_entry, index) => {
					if (this.is_equal(existing_entry._shortcut[0], entry._shortcut[0])) {
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
}
