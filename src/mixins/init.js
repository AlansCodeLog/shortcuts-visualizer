export default {
	methods: {
		init(options) {
			let process = this.init_process_options(options)
			//note properties won't be reactive sometimes if they aren't cloned/copied, that's why all the clone deep
			//also we don't want to modify the parent props, all modifications should be emitted up.

			if (process.keys) {
				this.keys = _.cloneDeep(this.keys_list)
				
				this.keymap = this.create_keymap()
				this.modifiers_names = _.uniq(
					Object.keys(this.keymap)
						.filter(identifier => this.keymap[identifier].is_modifier)
						.map(identifier => this.keymap[identifier].identifier)
				).sort()
			}

			if (process.shortcuts || process.keys) {
				//var because we need it outside of this if statement later
				var lists = this.create_shortcuts_list(_.cloneDeep(this.shortcuts_list))
				this.shortcuts = lists.shortcuts_list
			}
			
			if (process.shortcuts) {
				this.contexts = lists.context_list
					.map(entry => (entry = entry.toLowerCase()))
					.sort()
			}
			if (process.contexts) {
				this.active_context = this.dev_options.default_context
			}

			if (this.modifiers_order == undefined
			|| this.modifiers_order.length == 0) {
				
				this.modifiers_order = _.uniq(
					this.modifiers_names.map(identifier => this.keymap[identifier].character)
				).sort()
			}
			if (process.shortcuts || process.keys) {
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
				let new_entries = this.create_shortcut_entry(entry, false, shortcuts)
				
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
		create_shortcut_entry (entry, editing = false, existing_shortcuts = this.shortcuts) {
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
				
				let existing_index = existing_shortcuts.findIndex((existing_entry, index) => {
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
				existing_shortcuts.map((existing_entry, index) => {
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
}
