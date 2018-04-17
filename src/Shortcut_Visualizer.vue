<template>
   <div
      :class="['shortcut-visualizer', options.theme_dark ? 'background-dark' : 'background-light']"
   >
      <Options
         @input="change('options', $event)"
         :contexts="contexts"
         :modes="modes"
         :options="options"
      ></Options>
      <Keys
         @keydown="keydown($event)"
         @keyup="keyup($event)"
         @delete="delete_entry($event)"
         @add_to_bin="add_to_bin($event)"
         @edit="shortcut_edit($event)"
         @freeze="change('freeze', $event)"
         :chain="chain"
         :keymap="keymap"
         :keymap_active="keymap_active"
         :keys="keys"
         :layout="layout"
         :modifiers_names="modifiers_names"
         :modifiers_order="modifiers_order"
         :normalize="normalize"
         :shortcuts="shortcuts"
         :shortcuts_active="shortcuts_active"
      ></Keys>
      <!-- tells us what's being pressed, whether we're waiting for a chain, etc -->
      <div class="status">
         <div v-if="chain.in_chain">Waiting on chain: {{normalize(chain.start).join("+")}}</div>
         <div v-if="chain.warning">No chained shortcut {{normalize(chain.last).join("+")}} {{normalize(chain.warning).join("+")}}</div>
         <div v-if="keymap_active.length > 0">Pressed: {{normalize(keymap_active).join("+")}}</div>
         <div class="error" v-if="error_message">{{error_message}}</div>
      </div>
      <div class="bins">
         <Bin
            @add="add_to_bin($event)"
            @delete="delete_entry($event)"
            @freeze="change('freeze', $event)"
            :bin="bin"
            :block_singles="block_singles"
            :chain="chain"
            :commands="commands"
            :keymap="keymap"
            :keymap_active="keymap_active"
            :modifiers_names="modifiers_names"
            :modifiers_order="modifiers_order"
            :options="options"
            :shortcuts="shortcuts"
            :shortcuts_active="shortcuts_active"
            :shortcuts_list_active="shortcuts_list_active"
         ></Bin>
         <div class="delete-bin"></div>
      </div>
      <ShortcutsList
         @add="shortcut_add($event)"
         @error="set_error($event)"
         @add_to_bin="add_to_bin($event)"
         @delete="delete_entry($event)"
         @edit="shortcut_edit($event)"
         @freeze="change('freeze', $event)"
         :chain="chain"
         :commands="commands"
         :contexts="contexts"
         :keymap="keymap"
         :modifiers_names="modifiers_names"
         :modifiers_order="modifiers_order"
         :normalize="normalize"
         :options="options"
         :shortcuts="shortcuts"
         :shortcuts_list_active="shortcuts_list_active"
      ></ShortcutsList>
   </div>
</template>

<script>
import Keys from "./components/keys"
import Options from "./components/options"
import ShortcutsList from "./components/shortcut_list"
import Bin from "./components/bin"


import * as _ from "lodash"
import {chain_in_active, create_keymap, create_shortcut_entry, create_shortcuts_list, find_extra_keys_pressed, find_extra_modifiers, get_shortcuts_active, keys_from_text, multisplice, normalize} from "./helpers/helpers"

export default {
	name: 'Shortcut-Visualizer',
	props: ["ops"],
	components: {
		Keys,
		Options,
		ShortcutsList,
		Bin
	},
	data() {  
		return {
         //will be set by props (handled in created)
			layout: [], //layout,
			keys: {}, //keys,
			keymap: {}, //keymap,
			modifiers_names: [], //modifiers_names,
			modifiers_order: [], //modifiers_order,
			shortcuts: [], //shortcuts_list,
			contexts: [], //context_list,
			commands: [], //commands
			timeout: 3000,
         //private to component
			modes: ["As Pressed", "Toggle Modifiers", "Toggle All"],
			chain: {
            //allow: true,
				in_chain: false,
				start: [],
				last: [],
				warning: false,
			},
         //todo allow hiding/overiding by props
			options: {
				mode: "Toggle All",
				theme_dark: true,
				accept_on_blur: true,
				context: "global",
			},
			mods_unknown: true,
			freeze: false,
			bin: [],
			block_singles: true,
			error_message: false
		}
	},
	computed: {
		keymap_active () {
			return Object.keys(this.keymap).filter(identifier => {
				let key = this.keymap[identifier];
				return key.active
			}).sort()
		},
		shortcuts_active () {
			return get_shortcuts_active (this, false)
		},
		shortcuts_list_active () {
			return get_shortcuts_active (this, true)
		},
	},
	methods: {
      //make normalize accesible to template
		normalize (identifiers) {
			return normalize(identifiers, this)
		},
      //set property by key (used to set freeze and options)
		change (key, data) {
			this[key] = data
		},
      //display error messages to user
		set_error(error, timeout_multiplier = 1) {
			this.error_message = error.message
			setTimeout(() => {
				this.error_message = false
			}, this.timeout * timeout_multiplier);
		},
      //handles the chain state and setting chain not found error
		toggle_chain(data) {
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
				}, this.timeout/3);
			}
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
      //just pushes a new entry without any checks, this is because it's easier to do checks and warn the user about an error without chainging a component's temporary state from within that component //todo? change
		shortcut_add(entry) {
			this.shortcuts.push(entry)
		},
      //for editing any existing entries and/or swapping between them, NOT for adding an entry
		shortcut_edit({old_entry, new_entry}, checks = true) {
         //get our shortcut array if we didn't already
			new_entry._shortcut = typeof new_entry._shortcut !== "undefined"
            ? new_entry._shortcut
            : keys_from_text(new_entry.shortcut, this)._shortcut
         
         //find the index of our old entry
			let index = this.shortcuts.findIndex(existing_entry => {
				return existing_entry.shortcut == entry.shortcut
            && existing_entry._shortcut.join() == entry._shortcut.join()
            && existing_entry.contexts.join() == entry.contexts.join()
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
      //makes the shortcuts flash to indicate what else changed (like in the case where chain starts are swapped)
		shortcut_edit_success(entries) {
			entries.map(entry => {
				entry.changed = true 
				setTimeout(() => {
					entry.changed = false
				}, this.timeout/10);
			})
		},
      //add an entry to the bin, note this entries still technically have most of their properties and they are used
		add_to_bin(entry, extra = false) {
			if (!extra) {
				let index = this.shortcuts.findIndex(existing_entry => {
					return existing_entry.shortcut == entry.shortcut
               && existing_entry.command == entry.command
               && existing_entry.contexts.join("") == existing_entry.contexts.join("")
				})
				this.shortcuts.splice(index, 1)
			}
			let current_context_index = entry.contexts.indexOf(this.options.context)
         //remove the current context since a common use should be to change a shortcut's context
			entry.contexts.splice(current_context_index, 1)
			this.bin.push(entry)
			if (!extra && entry.chain_start) {
				let indexes = this.shortcuts.map((existing_entry, index) => {
					if (existing_entry.chained && existing_entry._shortcut[0].join("") == entry._shortcut[0].join("")) {
						return index
					}
				}).filter(entry => typeof entry !== "undefined")
				for (let entry_index of indexes) {
					this.add_to_bin(this.shortcuts[entry_index], true)
				}
				multisplice(this.shortcuts, indexes)
			}
		},
      //handles keypresses
		keydown (e) {
			let identifier = e.code
			e.preventDefault()
			e.stopPropagation()
			if (this.freeze) {return}
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
			this.keypress_set_mods(e)
			this.keypress_set_RL(e)
			this.$emit("input", this.keymap)
		},
		keyup (e) {
			let identifier = e.code
			e.preventDefault()
			e.stopPropagation()
			if (this.freeze) {return}
			if (this.keymap[identifier].nokeydown) {
				this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? !this.keymap[identifier].active : true
				this.keymap[identifier].timer = setTimeout(() => {
					this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? this.keymap[identifier].active : false
				}, this.timeout/10);
			} else {
				if (this.options.mode == "Toggle Modifiers") {
					if (!this.keymap[identifier].is_modifier){
						this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? this.keymap[identifier].active : false
					}
				} else if (this.options.mode !== "Toggle All") {
				}
				this.keypress_set_mods(e)
			}
			this.keypress_set_RL(e)
			this.$emit("input", this.keymap)
		},
      //small helpers for handling keypresses
      //sets the state of special keys like numlock
		keypress_set_mods (e) {
			if (this.mods_unknown) {
				this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
				this.keymap["NumLock"].active = e.getModifierState("NumLock")
				this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
				this.mods_unknown = false
			} else if (this.keymap[identifier].toggle) {
				this.keymap[identifier].active = e.getModifierState(identifier)
			}
		},
      //makes both left and right versions of a key active
		keypress_set_RL (e) {
			if (this.keymap[identifier].RL == true) {
				if (identifier.indexOf("Right") !== -1) {
					this.keymap[identifier.replace("Right", "Left")].active = this.keymap[identifier].active
				} else {
					this.keymap[identifier.replace("Left", "Right")].active = this.keymap[identifier].active
				}
			}
		}
	},
	watch: {
      //handles the chain state
		"keymap_active" (newactive) {
			if (this.chain.in_chain) {
				let none_modifiers_pressed = newactive.filter(identifier => !this.keymap[identifier].is_modifier).length > 0 ? true : false
            //is there are keys being pressed that aren't modifiers that have not shortcuts
				if (newactive.length > 0 && none_modifiers_pressed && this.shortcuts_active.length == 0) {
					this.toggle_chain({in_chain: false, warning: [...newactive]})
				}
			} else {
				let trigger_chain = chain_in_active(newactive, this)
				if (trigger_chain) {
					this.toggle_chain(trigger_chain)
				}
			}
		},
	},
	created() {
      //TODO? wrap in another compenent that watches for changes to options but allows this component to name them as it likes
		let {layout, keys, shortcuts, commands, timeout} = this.ops
		this.layout = layout
		this.keys = keys
      // this.block_singles
		this.keymap = create_keymap(this.keys)
		this.modifiers_names = _.uniq(Object.keys(this.keymap).filter(identifier => this.keymap[identifier].is_modifier).map(identifier => this.keymap[identifier].identifier))
		this.modifiers_order = ["ctrl", "shift", "alt"]
      
		let lists = create_shortcuts_list(shortcuts, this)
		this.shortcuts= lists.shortcuts_list
		this.contexts = lists.context_list.map(entry => entry = entry.toLowerCase()).sort()
		this.commands = commands
	},
}
</script>

<style lang="scss">

.shortcut-visualizer {
   @import "./settings/theme.scss";
   &.background-light {
      background: $theme-light-background;
      color: invert($theme-light-background);
      input {
         color: invert($theme-light-background);
      }
   }
   &.background-dark {
      background: $theme-dark-background;
      color: invert($theme-dark-background);
      input {
         color: invert($theme-dark-background);
      }
   }
   .status {
      margin: 0 $padding-size/2 $padding-size;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      & > div {
         flex: 1 0 100%;
         margin: 0.5em;
         text-align: center;
      }
      .error {
         color: red;
      }
   }

   .bins {
      display:flex;
      margin: 0 $padding-size;
      justify-content: space-between;
      .temp-bin {
         flex: 0 1 70%;
      }
      .delete-bin {
         flex: 0 1 30%;
         margin-left: $padding-size;
         align-self: stretch;
         background: transparentize(red, 0.7);
         border: transparentize(red, 0.7) 0.2em solid;
         display: flex;
         justify-content: center;
         align-items: center;
         &.hovering::after {
            content: "DELETE";
            color: red;
            font-size: 2em;
         }
         .bin-entry, .list-subentry, .key-entry {
            display: none;
         }
      }
   }

}
</style>
