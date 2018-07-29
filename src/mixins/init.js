export default {
	methods: {
		init(options) {
			let process = this.init_process_options(options)
			// note properties won't be reactive sometimes if they aren't cloned/copied, that's why all the clone deep
			// also we don't want to modify the parent props, all modifications should be emitted up.

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
				if (this.order_of_modifiers !== undefined) {
					let should_exist = []
					this.modifiers_names.forEach(key => {
						let name = this.keymap[key].character.toLowerCase()
						if (should_exist.indexOf(name) == -1) {
							should_exist.push(name)
						}
					})
					let lowercase_order_of_modifiers = this.order_of_modifiers.map(entry => {
						return entry.toLowerCase()
					})
					let incorrect = this.difference(lowercase_order_of_modifiers, should_exist)
					if (incorrect.length > 0) {
						throw `Unknown modifier names in "order_of_modifiers" ["${incorrect.join(",")}"]. Known modifiers are: ["${should_exist.join(", ")}"]`
					}
					let missing = this.difference(should_exist, lowercase_order_of_modifiers)
					if (missing.length > 0) {
						throw `Missing modifiers in "order_of_modifiers": ["${missing.join(", ")}"]`
					}
					this.modifiers_order = lowercase_order_of_modifiers
				} else {
					this.modifiers_order = this.dedupe_presorted(
						this.modifiers_names.map(identifier => this.keymap[identifier].character.toLowerCase()).sort()
					)
				}
			}

			if (process.shortcuts || process.keys) {
				// var because we need it outside of this if statement later
				var lists = this.create_shortcuts_list(this.shortcuts_list)
			}

			if (process.shortcuts) {
				this.contexts_info = lists.contexts_info
			}
			if (process.contexts) {
				this.active_context = this.dev_options.default_context
			}

			if (process.shortcuts || process.keys) {
				this.shortcuts = lists.shortcuts_list
				this.$emit("ready", { shortcuts_list: this.shortcuts.map(entry => this.deep_clone_entry(entry)) })
			}
		},
		// init helpers
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
		// for devs
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
				} else {
					throw `Unknown key ${key}. Key should be one of ["${Object.keys(options_keys).join(", ")}"]`
				}
			})

			this.init(init_options)
		},
		// functions for verifying/creating shortcuts/keys/keymaps, some also used elsewhere
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
					block_all: key.block_all || false,
					ignore: key.ignore || false,
					nokeydown: key.nokeydown || false,
					toggle: key.toggle || false,
					fake_toggle: key.fake_toggle || false,
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
				// keys get added to keys regardless of any error
				keys[keyname] = entry

				if (key.ignore == true || typeof key.identifier == "undefined") {
					return
				}

				// Duplicate identifier error.
				if (keymap[key.identifier] !== undefined) {
					throw "Duplicate key identifier " + key.identifier + " at keys: " + Object.keys(keys).filter(otherkey => {return keys[otherkey].identifier == key.identifier}).join(", ")
				}
				// keys don't get added to keymap unless they  reach this point
				keymap[key.identifier] = entry
			})
			return { keymap, keys }
		},
		create_shortcuts_list (settings_shortcuts) {
			// create empty array because we might push to it more than once per entry
			let shortcuts = []
			let contexts_info = {}

			settings_shortcuts.map(entry => {
				let { error, to_add, to_remove, entry: new_entry } = this.create_shortcut_entry(this.deep_clone_entry(entry), false, shortcuts)

				if (error) {
					// if error has no message then it can usually be ignored
					this.validate_error("init", error)
					if (error.message) {
						throw error
					} else {
						if (error.type) {
							// we forgot to add proper message to some error
							// or mispelled it
							throw { message: `Should never throw (create_shortcuts_list should always throw on any error). If this is throwing, this error type (${error.type}) isn't being handled properly, please file an issue.` }

						} else {
							// something else caused an error?
							throw error
						}
					}
				}
				if (to_remove) {
					for (let index of to_remove) {
						for (let context of shortcuts[index].contexts) {
							contexts_info[context].count -= 1
						}
					}
					this.multisplice(shortcuts, to_remove)
				}
				let entries = [new_entry]
				if (to_add) {
					entries.push(to_add)
				}

				for (let _new_entry of entries) {
					for (let context of _new_entry.contexts) {
						if (contexts_info[context] == undefined) {
							contexts_info[context.toLowerCase()] = { count: 1 }
						} else{
							contexts_info[context].count += 1
						}
					}
				}
				shortcuts.push(new_entry)
				if (to_add) {
					shortcuts.push(to_add)
				}
			})
			let ordered_binned = []

			shortcuts.map((entry, index) => {
				if (entry._is_not_original) {
					delete entry._is_not_original
				}
				// adds index property to all shortcuts
				entry.index = index
				// if entry was binned, check it has holder and push it's group to ordered bin
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

			return { shortcuts_list: shortcuts, contexts_info: contexts_info }
		},
		create_shortcut_entry (entry, editing = false, existing_shortcuts = this.shortcuts) {

			let error = false

			if (entry.shortcut == undefined) {
				error = this.create_error("shortcut undefined", { entry })
				return { error }
			}
			if (entry.shortcut == "") {
				error = this.create_error("shortcut empty", { entry })
				return { error }
			}

			if (entry._shortcut == undefined) {
				let result
				try { // might fail do to invalid keys
					result = this.keys_from_text(entry.shortcut)
				} catch (error) {
					// forward error
					error = error
					return { error }
				}
				entry._shortcut = result._shortcut
				entry.shortcut = result.shortcut
			}

			if (entry.contexts == undefined) {
				entry.contexts = ["global"]
			} else if (Array.isArray(entry.contexts)) {
				entry.contexts = entry.contexts.map(entry => entry.toLowerCase()).sort()
			} else {
				error = this.create_error("invalid contexts type", { entry })
				return { error }
			}
			if (entry.contexts.length == 0) {
				error = this.create_error("missing contexts", { entry })
				return { error }
			}

			entry.command = entry.command || ""
			entry.binned = entry.binned || false
			entry.chained = entry._shortcut.length > 1 ? true : false
			entry.chain_start = entry.chain_start || false

			if (entry.chained && entry.chain_start) {
				error = this.create_error("invalid chained chain start", { entry })
				return { error }
			}

			// if it passed without error untill this point then the entry object was formatted validly

			for (let keyset of entry._shortcut) {
				// get modifiers in keyset
				let modifiers = []
				let non_modifiers = []
				let blocked_alone = []
				let not_blocked_alone = []

				keyset.filter(key => {
					if (!this.keymap[key].block_alone) {
						not_blocked_alone.push(key)
					}
					if (this.keymap[key].is_modifier) {
						modifiers.push(key)
					} else {
						non_modifiers.push(key)
					}
					if (this.keymap[key].block_alone) {
						blocked_alone.push(key)
					}
				})

				if (non_modifiers.length > 1) {
					error = this.create_error("multiple non-modifiers", { entry, non_modifiers })
					return { error }
				}

				// BLOCKED ALONE
				// blocked_alone should be checked before blocked_single
				// note i think the first condition is always true?
				if (blocked_alone.length > 0 && not_blocked_alone.length == 0) {
					error = this.create_error("blocked alone", { entry, blocked_alone })
					return { error }
				}

				// BLOCKED SINGLE
				let blocked_singles = this.get_blocked_singles(modifiers)
				if (blocked_singles) {
					error = this.create_error("blocked single", { entry, blocked_singles })
					return { error }
				}

				// BLOCKED ALL
				let blocked_all = keyset.filter(key => this.keymap[key].block_all)
				if (blocked_all.length > 0) {
					if (entry.chained) {
						entry._shortcut[1].map(key => {
							if (this.keymap[key].block_all) {
								blocked_all.push(key)
							}
						})
					}
					error = this.create_error("blocked all", { entry, blocked_all })
					return { error }
				}
			}
			// if it passed to this point the entire entry was formatted validly and an entry will
			// be returned regardless of further errors

			let overwrite = false

			// using findIndex because returning inside findIndex is like break in a loop
			existing_shortcuts.findIndex((existing_entry, index) => {
				// ignore shortcuts without conflicting contexts
				let conflicting_contexts = existing_entry.contexts.filter(context => entry.contexts.indexOf(context) !== -1)
				if (conflicting_contexts.length == 0) {return false}

				let editing_conditions = !editing || (editing && entry.index !== existing_entry.index)

				if (entry.shortcut == existing_entry.shortcut) {
					// IF both are chain starts
					if (entry.chain_start && existing_entry.chain_start) {
						// it's not a problem if the existing entry was auto created
						if (existing_entry._is_not_original) { // never happens when editing btw because _is_not_original property is deleted
							overwrite = true
							return true
						} else if (editing_conditions) {
							error = this.create_error("duplicate chain start", { entry, existing_entry, index, conflicting_contexts })
							return true
						}
					// ELSE if the user created them...
					// neither is a chain start
					} else if (!entry.chain_start && !existing_entry.chain_start) {
						if (editing_conditions) {
							error = this.create_error("duplicate shortcut", { entry, existing_entry, index, conflicting_contexts })
							return true
						}
					// existing entry is a chain start but new entry isn't
					} else if (!entry.chain_start && existing_entry.chain_start) {
						error = this.create_error("chain error new", { entry, existing_entry, index, conflicting_contexts })
						return true
					// new entry is chain start but existing isn't
					} else if (entry.chain_start && !existing_entry.chain_start) {
						error = this.create_error("chain error existing", { entry, existing_entry, index, conflicting_contexts })
						return true
					}
				} else if (this.is_equal(entry._shortcut[0], existing_entry._shortcut[0])) {
					// if long new entry e.g. ctrl+a a and ctrl+a exists but it isn't a chain start
					if (entry.chained && !existing_entry.chained && !existing_entry.chain_start) {
						error = this.create_error("should be chain existing", { entry, existing_entry, index, conflicting_contexts })
						return true

					// if short new entry e.g. ctrl+a should be chain start because ctrl+a a exists but it isn't
					} else if (!entry.chained && existing_entry.chained && !entry.chain_start) {
						if (!editing) { // if editing we should eventually hit the real chain start
							error = this.create_error("should be chain new", { entry, existing_entry, index, conflicting_contexts })
							return true
						}
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
					command: "Chain Start",
					chain_start: true,
					chained: false,
					_shortcut: [entry._shortcut[0]],
					shortcut: this.normalize(entry._shortcut[0]).join("+"),
					contexts: [...entry.contexts],
					_is_not_original: true,
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

			// remove any existing chain starts so replacement can be put
			let chain_starts_to_remove = false
			if (overwrite && entry.chain_start) {
				let existing_indexes = []
				existing_shortcuts.map((existing_entry, index) => {
					if (this.is_equal(existing_entry._shortcut[0], entry._shortcut[0])) {
						if (existing_entry.chain_start) {
							existing_indexes.push(index)
						}
					}
				})
				if (existing_indexes.length > 0) {
					chain_starts_to_remove = existing_indexes
				}
			}

			// for internal use
			entry.editing = false
			entry.changed = false
			entry.dragging = false

			return { entry, to_add: extra_entry, to_remove: chain_starts_to_remove, error }
		},
	},
}
