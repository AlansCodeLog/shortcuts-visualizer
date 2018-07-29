export default {
	methods: {
		// just pushes a new entry without any checks, this is because it's easier to do checks and warn the user about an error without changing a component's temporary state from within that component //todo? change
		shortcut_add(entry) {
			entry.index = this.shortcuts.length
			this.check_add_contexts([entry])
			this.shortcuts.push(entry)
		},
		check_remove_contexts(entries) {
			for (let entry of entries) {
				for (let context of entry.contexts) {
					if (context !== "global") {
						this.contexts_info[context].count -= 1
						if (this.contexts_info[context].count <= 0 && this.user_options.delete_empty_contexts) {

							if (this.active_context == context) {
								this.active_context = "global"
							}
							this.$delete(this.contexts_info, context)
						}
					}
				}
			}
		},
		check_add_contexts(entries) {
			for (let entry of entries) {
				for (let context of entry.contexts) {
					if (context !== "global") {
						if (this.contexts_info[context] !== undefined) {
							this.contexts_info[context].count += 1
						} else {
							this.$set(this.contexts_info, context, { count: 1 })
						}
					}
				}
			}
		},
		// completely delete an entry, does not do any cleanup //todo? add option
		delete_entry(entry) {
			this.check_remove_contexts([entry])
			this.$emit("change", { entries: [this.deep_clone_entry(entry)], type: "deleted" })
			this.shortcuts.splice(entry.index, 1)
			this.shortcuts.map((entry, index) => entry.index = index)
		},
		// add an entry to the bin, note these entries still technically have most of their properties and they are used
		add_to_bin(entry) {
			this.bin_holder_index += 1
			entry.holder = this.bin_holder_index
			let entries = []
			entries.push(entry)
			entry.binned = true
			entry.shortcut
			// if entry is chained/chain_start, mark all it's entries, and if it's a chain start also move all to the bin
			if (entry.chain_start || entry.chained) {
				this.shortcuts.map((existing_entry) => {
					if (existing_entry.chained
						&& existing_entry._shortcut[0].join("") == entry._shortcut[0].join("")) {
						existing_entry.holder = entry.holder
						if (entry.chain_start) {
							existing_entry.binned = true
							entries.push(existing_entry)
						}
					}
				})
			}
			this.check_remove_contexts(entries)
			this.shortcut_edit_success(entries, "moved_to_bin")
		},
		// move an entry from the bin to "somewhere else"
		move_from_bin(entry, new_entry) {
			let entries = []
			entry.binned = false

			if (new_entry.index !== undefined && entry.index !== new_entry.index) {
				this.add_to_bin(new_entry)
			}

			// if the entry was a chain_start, we move all it's chained command with it
			if (entry.chain_start) {
				this.bin.map((existing_entry, index) => {
					if (existing_entry.holder == entry.holder) {
						existing_entry._shortcut[0] = new_entry._shortcut[0]
						existing_entry.shortcut = existing_entry._shortcut.map(keyset => this.normalize(keyset, this).join("+")).join(" ")
						// add the current context if it's missing
						if (!existing_entry.contexts.includes(this.active_context)) {
							existing_entry.contexts.push(this.active_context)
							existing_entry.contexts.sort()
						}
						existing_entry.binned = false
						entries.push(existing_entry)
						delete existing_entry.holder
						return index
					}
				})
			}
			entry._shortcut = new_entry._shortcut
			entry.shortcut = new_entry.shortcut
			// add the current context if it's missing
			if (!entry.contexts.includes(this.active_context)) {
				entry.contexts.push(this.active_context)
				entry.contexts.sort()
			}
			// delete entry.holder //TODO
			entries.push(entry)
			this.check_add_contexts(entries)
			this.shortcut_edit_success(entries, "moved_to_shortcuts")
		},
		// makes the shortcuts flash to indicate what else changed (like in the case where chain starts are swapped)
		shortcut_edit_success(entries, type) {
			let cloned_entries = entries.map(entry => {
				return this.deep_clone_entry(entry)
			})
			this.$emit("change", { changed: cloned_entries, type })
			entries.map(entry => {
				entry.changed = true
				setTimeout(() => {
					entry.changed = false
				}, this.dev_options.timeout_edit_success)
			})
		},
		validate_entry(entry, adding_entry = true, validate_errors_type = "validate") {

			// handle any error
			let contexts_is_array = Array.isArray(entry.contexts)
			if (entry.contexts == "" || (contexts_is_array && entry.contexts.length == 0)) {
				this.set_error({ message: "A context wasn't specified, setting to global.", type: "warning" })
				entry.contexts = [this.active_context]
				contexts_is_array = true
			}

			if (!contexts_is_array) {
				entry.contexts = entry.contexts.toLowerCase().split(/\s*,\s*/g)
			}

			let result = this.create_shortcut_entry(entry, true)

			let valid_entry = result.entry || false

			let { error } = result

			if (error) {
				this.validate_error(validate_errors_type, error, {
					adding_entry,
					index: entry.index,
				})
				// if error has no message then it can be ignored
				if (error.message) {
					this.set_error({ ...error, type: "error" })
					return false
				}
			}
			return result
		},
		// for editing any existing entries and/or swapping between them, NOT for adding an entry
		shortcut_edit({ old_entry, new_entry }, checks = true, is_hand_edit = false) {

			// if an entry was hand edited it should pass the same exact checks as a new entry
			if (is_hand_edit) {
				// fetch our entry
				var result = this.validate_entry(new_entry, false)
				// validate_entry will handle errors
				if (result === false) {return}
			} else { // otherwise with dragging, it has already passed some checks
				var result = this.create_shortcut_entry(new_entry, true)
			}

			if (!this.is_equal(new_entry.contexts, old_entry.contexts)) {
				this.check_remove_contexts([old_entry])
				this.check_add_contexts([new_entry])
				new_entry.contexts.sort()
			}

			// if the shortcut is invalid (any keys are invalid or if a key is blocked)
			if (result.entry == undefined) {
				this.set_error(error)
				return
			}

			// spread variables returned by result
			let { to_add, error } = result
			new_entry = result.entry // can't be spread, already exists


			// if we get an error but there's a valid entry
			// then because of that we know there's an entry we can swap with
			// if we can/can't swap should have been checked in the dragging/etc
			// when hand editing, advanced swapping is blocked (in future will prompts)

			// get and "backup" the entry to swap if it exists since we will change it
			if (error) {
				var entry_swap = error.context.existing_entry
				var entry_swap_copy = this.deep_clone_entry(entry_swap)
			}

			// "backup" the old object
			let old_entry_copy = this.deep_clone_entry(old_entry)
			let swap_exists = error && old_entry_copy.shortcut !== entry_swap_copy.shortcut

			if (swap_exists) {
				new_entry.chain_start = old_entry.chain_start
				new_entry.chained = old_entry.chained
			}

			// somwhere to put all the entries we'll changed
			let entries = []

			// overwrite the old entry
			Object.keys(new_entry).map(prop => {
				old_entry[prop] = new_entry[prop]
			})
			entries.push(old_entry)


			// if no chain starts to deal with, swap everything but the shortcut
			if (swap_exists && !old_entry_copy.chain_start && !new_entry.chain_start) {

				Object.keys(new_entry).map(prop => {
					if (["shortcut", "_shortcut"].includes(prop)) {
						entry_swap[prop] = old_entry_copy[prop]
					}
				})
				entries.push(entry_swap)

			}

			// checks means whether to check if we need to clean up anything, when called from within here it's set to false
			if (checks) {
				// if either the old or entry swapped with is a chain, then we need to change all the dependent chains

				let chain_entry = false
				if (entry_swap_copy !== undefined && entry_swap_copy.chain_start !== undefined) {
					if (entry_swap_copy && entry_swap_copy.chain_start) {
						chain_entry = "entry_swap_copy"
					} else if (old_entry_copy.chain_start) {
						chain_entry = "old_entry_copy"
					}
				}

				if (!old_entry_copy.chain_start && !new_entry.chain_start) {
					// if we need to add a chain start
					if (to_add && !entry_swap) {
						to_add.index = this.shortcuts.length
						this.shortcuts.push(to_add)
						entries.push(to_add)
					}

					if (chain_entry && old_entry_copy.shortcut !== entry_swap_copy.shortcut) {

						let old_start = chain_entry == "entry_swap_copy" ? entry_swap_copy : old_entry_copy
						let chains = this.shortcuts.filter(entry => {
							if (entry.chained && old_start._shortcut[0].join("") == entry._shortcut[0].join("")) {
								return entry
							}
						})
						let new_start = chain_entry == "entry_swap_copy" ? old_entry_copy : new_entry
						for (let entry of chains) {
							let otherchange = {
								old_entry: entry,
								new_entry: {
									shortcut: new_start.shortcut + " " + this.normalize(entry._shortcut[1]).join("+"),
									command: entry.command,
									contexts: entry.contexts,
									chain_start: entry.chain_start
								}
							}

							this.shortcut_edit(otherchange, false)
						}
					}

					// if the old entry was chained we have to do some cleanup
					if (old_entry_copy.chained) {

						let chain_count = this.shortcuts.reduce((count, entry) => {
							if (!entry.chain_start && this.is_equal(entry._shortcut[0], old_entry_copy._shortcut[0])) {
								return count + 1
							} else {return count + 0}
						}, 0)
						// if there are no other chains dependent on chain start, remove it
						if (chain_count == 0) {
							let index_chain_start = this.shortcuts.findIndex(entry => entry.chain_start && entry._shortcut[0].join("") == old_entry_copy._shortcut[0].join(""))
							this.delete_entry(this.shortcuts[index_chain_start])
						}
					}
				} else { // swapping chain starts is similar but more of a mess

					// if we need to swap chain starts and all their chains, first we have to do the chains
					if (chain_entry) {
						if (old_entry_copy.shortcut !== entry_swap_copy.shortcut) {
							// first temporarily overwrite the chain start of our target chain
							{
								let old_start = chain_entry == "entry_swap_copy" ? old_entry_copy : entry_swap_copy
								this.shortcuts.map(entry => {
									if (entry.chained && this.is_equal(old_start._shortcut[0], entry._shortcut[0])) {
										entry._shortcut[0] = "TEMPSWAMP"
									}
								})

							}
							// change chains based on source
							{
								let old_start = chain_entry == "entry_swap_copy" ? entry_swap_copy : old_entry_copy
								let chains = this.shortcuts.filter(entry => {
									if (entry.chained && this.is_equal(old_start._shortcut[0], entry._shortcut[0])) {
										return entry
									}
								})

								let new_start = chain_entry == "entry_swap_copy" ? old_entry_copy : new_entry
								for (let entry of chains) {
									let otherchange = {
										old_entry: entry,
										new_entry: {
											shortcut: new_start.shortcut + " " + this.normalize(entry._shortcut[1]).join("+"),
											command: entry.command,
											contexts: entry.contexts,
											chain_start: entry.chain_start
										}
									}

									this.shortcut_edit(otherchange, false)
								}
							}

							// then the same thing reversed for the chains we previously swapped out //TODO simplify to method
							{
								let chains = this.shortcuts.filter(entry => {
									if (entry.chained && entry._shortcut[0] == "TEMPSWAMP") {
										return entry
									}
								})

								let new_start = chain_entry == "entry_swap_copy" ? new_entry : old_entry_copy
								for (let entry of chains) {
									let otherchange = {
										old_entry: entry,
										new_entry: {
											shortcut: new_start.shortcut + " " + this.normalize(entry._shortcut[1]).join("+"),
											command: entry.command,
											contexts: entry.contexts,
											chain_start: entry.chain_start
										}
									}

									this.shortcut_edit(otherchange, false)
								}
							}
						}
						// then we do the final chain swap
						Object.keys(new_entry).map(prop => {
							if (["shortcut", "_shortcut"].includes(prop)) {
								entry_swap[prop] = old_entry_copy[prop]
							}
						})
						entries.push(entry_swap)
						entries.push(old_entry)
					}
				}
			}
			this.shortcut_edit_success(entries, "edited")
		},
	}
}