import Vue from "vue"
import _ from "lodash"
import {keys_from_text, create_shortcut_entry, find_extra_keys_pressed,  find_extra_modifiers, multisplice, normalize} from "../helpers/helpers"

export const shortcut_editing_handlers = Vue.mixin({
	methods: {
		//just pushes a new entry without any checks, this is because it's easier to do checks and warn the user about an error without chainging a component's temporary state from within that component //todo? change
		shortcut_add(entry) {
			this.shortcuts.push(entry)
		},
		//completely delete an entry, does not do any cleanup //todo? add option
		delete_entry(entry) {
			let index = this.shortcuts.findIndex(existing_entry => {
				return existing_entry.shortcut == entry.shortcut
				&& existing_entry._shortcut.join() == entry._shortcut.join()
				&& existing_entry.contexts.join() == entry.contexts.join()
			})
			this.shortcuts.splice(index, 1)
		},
		//add an entry to the bin, note these entries still technically have most of their properties and they are used
		//extra is used internally by the function to call itself again for handling chains
		add_to_bin(entry) {
			//find the entry in shortcuts
			let index = this.shortcuts.findIndex(existing_entry => {
				return existing_entry.shortcut == entry.shortcut
				&& existing_entry.command == entry.command
				&& existing_entry.contexts.join("") == existing_entry.contexts.join("")
			})
			//remove from shortcuts
			this.shortcuts.splice(index, 1)
			//function to remove the contexts, as we might need it again
			let remove_context = (entry) => {
				let current_context_index = entry.contexts.indexOf(this.active_context)
				entry.contexts.splice(current_context_index, 1)
			}
			remove_context(entry)
			this.bin.push(entry)
			//if entry is a chain start, move all it's entries to the bin
			if (entry.chain_start) {
				let indexes = this.shortcuts.map((existing_entry, index) => {
					if (existing_entry.chained && existing_entry._shortcut[0].join("") == entry._shortcut[0].join("")) {
						return index
					}
				}).filter(entry => typeof entry !== "undefined")
				for (let entry_index of indexes) {
					remove_context(this.shortcuts[entry_index])
					this.bin.push(this.shortcuts[entry_index])
				}
				multisplice(this.shortcuts, indexes)
			}
		},
		//move an entry from the bin to "somewhere else" aka a different shortcut
		move_from_bin(index, new_entry) {
			let entry = this.bin[index]
			//if the entry was a chain_start, we move all it's chained command with it
			if (entry.chain_start) {
				let indexes = this.bin.map((existing_entry, index) => {
					if (existing_entry.chained && existing_entry._shortcut[0].join("") == entry._shortcut[0].join("")) {
						return index
					}
				}).filter(entry => typeof entry !== "undefined")
				for (let entry_index of indexes) {
					let existing_entry = this.bin[entry_index]
					existing_entry._shortcut[0] = new_entry._shortcut[0]
					existing_entry.shortcut = existing_entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")
					//when an item is added to the bin, only it's current context is removed, so here we just add the new current context
					existing_entry.contexts.push(this.active_context)
					this.shortcuts.push(existing_entry)
				}
				multisplice(this.bin, indexes)
			}
			this.bin.splice(index, 1)
			entry._shortcut = new_entry._shortcut
			entry.shortcut = new_entry.shortcut
			//when an item is added to the bin, only it's current context is removed, so here we just add the new current context
			entry.contexts.push(this.active_context)
			this.shortcuts.push(entry)
		},
		//makes the shortcuts flash to indicate what else changed (like in the case where chain starts are swapped)
		shortcut_edit_success(entries) {
			entries.map(entry => {
				entry.changed = true 
				setTimeout(() => {
					entry.changed = false
				}, this.timeout/10)
			})
		},
		//for editing any existing entries and/or swapping between them, NOT for adding an entry
		shortcut_edit({old_entry, new_entry}, checks = true) {
			
			//get our shortcut array if we didn't already
			new_entry._shortcut = typeof new_entry._shortcut !== "undefined"
				? new_entry._shortcut
				: keys_from_text(new_entry.shortcut, this)._shortcut
			
			//find the index of our old entry
			let index = this.shortcuts.findIndex(existing_entry => {
				return existing_entry.shortcut == old_entry.shortcut
				&& existing_entry._shortcut.join() == old_entry._shortcut.join()
				&& existing_entry.contexts.join() == old_entry.contexts.join()
			})

			//since we don't allow non-chains to replace chain starts and vice versa, we can always get whether an entry is a chain start from the old entry
			if (old_entry.chain_start) {
				new_entry.chain_start = true
			}

			//if contexts are undefined, just use the old contexts
			if (typeof new_entry.contexts == "undefined") {
				new_entry.contexts = old_entry.contexts
			}

			//check if we need to create any new contexts
			for (let context of new_entry.contexts) {
				if (!this.contexts.includes(context)) {
					this.contexts.push(context)
				}
			}
			
			//fetch our entry
			let result = create_shortcut_entry(new_entry, this, undefined, true)
			//we can't spread new entry from the result because it's already defined
			new_entry = result.entry
			//spread variables returned by result
			let {extra, remove, error, invalid} = result

			//if the shortcut is invalid (any keys are invalid or if a key is blocked)
			if (invalid) {
				this.set_error(invalid)
				return
			}
			
			//get and "backup" the entry to swap if it exists since we will change it
			if (error) {
				var existing_index = error.index
				var entry_swap = this.shortcuts[existing_index]
				var entry_swap_copy = {...this.shortcuts[existing_index]}
			}
			//"backup" the old object
			let old_entry_copy = {...old_entry}
			let swap_exists = error && old_entry_copy.shortcut !== entry_swap_copy.shortcut

			console.log(swap_exists)
			
			
			//overwrite the old entry 
			Object.keys(new_entry).map(prop => {
				old_entry[prop] = new_entry[prop]
			})

			//if no chain starts to deal with, swap everything but the shortcut
			if (swap_exists && !old_entry_copy.chain_start && !new_entry.chain_start) {
				
				Object.keys(new_entry).map(prop => {
					if (["shortcut", "_shortcut"].includes(prop)) {
						entry_swap[prop] = old_entry_copy[prop]
					}
				})
				this.shortcut_edit_success([entry_swap])
				
			}
			this.shortcut_edit_success([old_entry])

			//checks means whether to check if we need to clean up anything, when called from within here it's set to false

			if (checks && !old_entry_copy.chain_start && !new_entry.chain_start) {
				
				// if we need to add a chain start
				if (extra && typeof entry_swap == "undefined") {
					this.shortcuts.splice(index, 0, extra)
					this.shortcut_edit_success([this.shortcuts[index]])
				}

				//if either the old or entry swapped with is a chain, then we need to change all the dependent chains
				let chain_entry = typeof entry_swap_copy !== "undefined" && entry_swap_copy.chain_start
					? "entry_swap_copy"
					: old_entry_copy.chain_start
						? "old_entry_copy"
						: false
				
				if (chain_entry && old_entry_copy.shortcut !== entry_swap_copy.shortcut) {
					
					let old_start = chain_entry == "entry_swap_copy" ? entry_swap_copy : old_entry_copy
					let chains = this.shortcuts.filter(entry => {
						if (entry.chained && _.isEqual(old_start._shortcut[0], entry._shortcut[0])) {
							return entry
						}
					})
					let new_start = chain_entry == "entry_swap_copy" ? old_entry_copy : new_entry
					for (let entry of chains) {
						let otherchange = {
							old_entry: entry,
							new_entry: {
								shortcut: new_start.shortcut + " " + normalize(entry._shortcut[1], this).join("+"),
								command: entry.command,
							}
						}
						
						this.shortcut_edit(otherchange, false)
					}
				}

				//if the old entry was chained we have to do some cleanup
				if (old_entry_copy.chained) {
					
					let chain_count = this.shortcuts.reduce((count, entry) => {
						if (!entry.chain_start && _.isEqual(entry._shortcut[0], old_entry_copy._shortcut[0])) {
							return count + 1
						} else {return count + 0}
					}, 0)
					//if there are no other chains dependent on chain start, remove it
					if (chain_count == 0) {
						let index_chain_start = this.shortcuts.findIndex(entry => entry.chain_start && _.xor(entry._shortcut[0], old_entry_copy._shortcut[0]).length == 0)
						this.shortcuts.splice(index_chain_start, 1)
					}
				}
			} else if (checks) { //swapping chain starts is similar but more of a mess
				//if we need to swap chain starts and all their chains, first we have to do the chains
				let chain_entry = typeof entry_swap_copy !== "undefined" && entry_swap_copy.chain_start
					? "entry_swap_copy"
					: old_entry_copy.chain_start
						? "old_entry_copy"
						: false

				if (chain_entry && old_entry_copy.shortcut !== entry_swap_copy.shortcut) {
					//first temporarily overwrite the chain start of our target chain
					{
						let old_start = chain_entry == "entry_swap_copy" ? old_entry_copy : entry_swap_copy
						this.shortcuts.map(entry => {
							if (entry.chained && _.isEqual(old_start._shortcut[0], entry._shortcut[0])) {
								entry._shortcut[0] = "TEMPSWAMP"
							}
						})
						
					}
					//change chains based on source
					{
						let old_start = chain_entry == "entry_swap_copy" ? entry_swap_copy : old_entry_copy
						let chains = this.shortcuts.filter(entry => {
							if (entry.chained && _.isEqual(old_start._shortcut[0], entry._shortcut[0])) {
								return entry
							}
						})
						
						let new_start = chain_entry == "entry_swap_copy" ? old_entry_copy : new_entry
						for (let entry of chains) {
							let otherchange = {
								old_entry: entry,
								new_entry: {
									shortcut: new_start.shortcut + " " + normalize(entry._shortcut[1], this).join("+"),
									command: entry.command,
								}
							}
							
							this.shortcut_edit(otherchange, false)
						}
					}

					//then the same thing reversed for the chains we previously swapped out //TODO simplify to method
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
									shortcut: new_start.shortcut + " " + normalize(entry._shortcut[1], this).join("+"),
									command: entry.command,
								}
							}
							
							this.shortcut_edit(otherchange, false)
						}
					}
				}
				//then we do the final chain swap
				Object.keys(new_entry).map(prop => {
					if (["shortcut", "_shortcut"].includes(prop)) {
						entry_swap[prop] = old_entry_copy[prop]
					}
				})
				this.shortcut_edit_success([entry_swap])
				this.shortcut_edit_success([old_entry])
			}
		},
	}
})