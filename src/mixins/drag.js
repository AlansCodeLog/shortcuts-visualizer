import Vue from "vue"
import _ from "lodash"
import dragula from "dragula"

const container_types = ["shortcut", "command", "contexts", "key-container", "bin", "delete-bin", "contexts-bar-container"]
const draggable_types = ["shortcut-entry", "command-entry", "context-entry", "contexts-bar-entry", "key-entry", "bin-entry"]

// LOGIC

// Dragging to Command

// Shortcut-Entry => Denied
// Shortcut-Entry Chain Start => Denied
// Command-Entry=> Swaps Commands, if Chain Start, Swamps with Shortcut
// Context-Entries => Copies Context just to Dragged, not to Chain Starts //maybe add option?
// Key-Entry => Swaps Commands
// Key-Entry Chain Start => Swaps Commands/Shortcut
// Bin-Entry => Swaps Commands

// Dragging to Shortcut

// Shortcut-Entry => Swaps Shortcut
// Shortcut-Entry Chain Start => Swaps Shortcut with Chain Start
// Command-Entry=> Denied
// Context-Entries => Copies Context just to Dragged, not to Chain Starts //maybe add option?
// Key-Entry => Denied
// Key-Entry Chain Start => Denied
// Bin-Entry => Denied

// Dragging to Key-Container

// Shortcut-Entry => Denied
// Shortcut-Entry Chain Start => Denied
// Command-Entry=> Moves Entire Shortcut, if Exists, Swaps Commands, if Chain Start, Swamps with Shortcut
// Context-Entries => N/A, if Exists, Copies Context just to Dragged, not to Chain Starts //maybe add option?
// Key-Entry => Moves Entire Shortcut, if Exists, Swaps Commands/Shortcut
// Key-Entry Chain Start => Moves ALL With Chain Start, if Exists, Swaps Commands/Shortcut
// Bin-Entry => Moves Entire Shortcut, if Exists, Swaps Commands 

// Dragging to Bin

// Shortcut-Entry => Moves Entire Shortcut
// Shortcut-Entry Chain Start => Moves ALL With Chain Start
// Command-Entry=> Moves Entire Shortcut
// Context-Entries => N/A // maybe allow? we are keeping a reference to the previous contexts after all
// Key-Entry => Moves Entire Shortcut
// Key-Entry Chain Start => Moves ALL With Chain Start
// Bin-Entry => N/A

// Dragging to Delete Bin

// Shortcut-Entry => Deletes Entire Shortcut
// Shortcut-Entry Chain Start => Deletes ALL With Chain Start //todo warning
// Command-Entry=> Deletes Entire Shortcut
// Context-Entry => Removes Context from Shortcut
// Context-Bar-Entry => Deletes Context from ALL shortcuts
// Key-Entry => Deletes Entire Shortcut
// Key-Entry Chain Start => Deletes ALL with Chain Start //todo warning
// Bin-Entry => Deletes Entire Shortcut

// Dragging to Contexts / Contexts-Bar
// should not actually drop into place.

// Shortcut-Entry => Adds Context to Shortcut
// Shortcut-Entry Chain Start => Copies Context just to Dragged, not to Chain Starts //maybe add option?
// Command-Entry=> Adds Context to Shortcut
// Context-Entries => N/A
// Key-Entry => Adds Context to Shortcut
// Key-Entry Chain Start => Copies Context just to Dragged, not to Chain Starts //maybe add option?
// Bin-Entry => Adds Context to Shortcut


export const drag_handlers = Vue.mixin({
	methods: {
		//for some reason moving the entire mounted hook to this mixin produces weeeeird behavior, but a method works
		drag_init() {
			let container_keys = this.$el.querySelectorAll(".draggable-container")
			//some place to store info about what we're dragging between handlers
			this.d = {}
			this.drake = dragula([...container_keys], {
				mirrorContainer: this.$el, //we want to keep the dragged element within this component to style it apropriately
				revertOnSpill: true, //so cancel will revert position of element
				copy: true, //copy false was causing glitching sometimes, this should be smoother, might introduce new bugs //to test
				isContainer: (el) => {
					return this.drag_is_container(el)
				},
				moves: (el, source, handle, sibling) => {
					return this.drag_moves(el, source, handle, sibling)
				},
				accepts: (el, target, source, sibling) => {
					if (this.drag_accepts(el, target, source, sibling)) {
						return true
					} else {
						this.drag_not_accepted(el, target, source, sibling)
						return false
					}
				},
			})
			this.drake.on("drag", () => {
				this.freeze = true
			}).on("over", (el, container, source) => {
				this.drag_on_over(el, container, source)
			}).on("out", (el, container, source) => {
				this.drag_on_out(el, container, source)
			}).on("drop", (el, target, source, sibling) => {
				this.drag_on_drop(el, target, source, sibling)
			}).on("cancel", (el, container, source) => {
				this.drag_on_cancel(el, container, source)
			})
		},
		get_container_info(el, type, is_list) {
			let shortcut = false
			let entry = false
			if (type == "key-container") {
				let key = el.previousElementSibling.innerText.toLowerCase().replace(" ", "")
				//keysss because modifiers might be right/left and keys_from_text will add both for us
				let keys = this.keys_from_text(key)._shortcut[0]
				//all this means is get the chain start, mix the active keys with the keys, remove any duplicates, sort them
				shortcut = [this.chain.start, _.uniq([...this.keymap_active, ...keys]).sort()]
					//then filter the entire thing for empty arrays (to clean an empty chain start)
					.filter(keyset => keyset.length !== 0)

				let existing = el.querySelector(".key-entry")
				if (existing) {
					let index = existing.getAttribute("active_shortcuts_index")
					entry = this.shortcuts_active[index]
				}
			}
			if (is_list) {
				let index = el.parentNode.getAttribute("index")
				entry = this.shortcuts_list_active[index]
				shortcut = entry._shortcut
			}
			return {shortcut, entry}
		},
		get_target_container_info(target) {
			for (let type of container_types) {
				if (target.classList.contains(type)) {
					let is_list = false
					let is_filled = false
					if ("key-container" === type) {
						is_filled = target.querySelector(".key-entry") == null ? false : true
					} else if (["shortcut", "contexts", "command"].includes(type)) {
						is_filled = true
						is_list = true
					}
					let is_chain = false
					if (is_filled) {
						if (type == "key-container") {
							is_chain = target.querySelector(".is_chain") == null ? false : true
						} else {//has to be to list-entry
							//BEWARE this is super fast, but if the order of the divs is changed this will break
							//todo check flexbox reordering doesn't break this?
							let chain_column = target.parentNode.childNodes[2]
							if (chain_column.classList.contains("is_chain")) {
								is_chain = true
							}
						}
					} else {
						is_chain = false
					}
					let is_modifier = false
					let is_block_all = false
					let is_block_alone = false
					let is_block_single = false
					for (let class_name of target.parentNode.classList) {
						if (class_name == "modifers") {is_modifier = true}
						if (class_name == "block_all") {is_block_all = true}
						if (class_name == "block_alone") {is_block_alone = true}
						if (class_name == "block_single") {is_block_single = true}
					}

					let {shortcut, entry} = this.get_container_info(target, type, is_list)

					return {type, is_filled, is_list, entry, is_chain, is_modifier, is_block_all, is_block_alone, is_block_single, shortcut}
				}
			}
			//should never happen
			throw `Shortcut Typechecker Error, ${el.classList} of element does not contain permitted class.\
			This error should never happen, please report an issue for the Shortcut-Visualizer component if it does.`
		},
		get_draggabled_element_info(el, source) {
			let info = {}
			for (let type of draggable_types) {
				let is_chain = false
				if (el.classList.contains(type)) {
					let is_list_entry = el.classList.contains("list-entry") == true ? true : false
					if (is_list_entry) {
						//BEWARE this is super fast, but if the order of the divs is changed this will break
						//todo check flexbox reordering doesn't break this?
						let chain_column = source.parentNode.childNodes[2]
						if (chain_column.classList.contains("is_chain")) {
							is_chain = true
						}
						info = {type, is_chain, is_list_entry}
						break
					} else {
						is_chain = el.classList.contains("is_chain") == true ? true : false
						info = {type, is_chain, is_list_entry}
						break
					}
				}
			}
			
			if (Object.keys(info).length == 0) {
				//should never happen
				throw `Shortcut Typechecker Error, ${el.classList} of element does not contain permitted class.\
				This error should never happen, please report an issue for the Shortcut-Visualizer component if it does.`
			} else {
				if (info.type == "key-entry") {
					let element_index = el.getAttribute("active_shortcuts_index")
					info.entry = this.shortcuts_active[element_index]
					info.shortcut = info.entry._shortcut
				}
				if (info.is_list_entry) {
					let element_index = source.parentNode.getAttribute("index")
					info.entry = this.shortcuts_list_active[element_index]
					info.shortcut = info.entry._shortcut
				}
				if (info.type == "bin-entry") {
					let element_index = source.querySelector(".command").getAttribute("index")
					// not needed
					// info.entry = this.bin[element_index]
					// info.shortcut = info.entry._shortcut
					info.bin_index = element_index
				}
				return info
			}
		},
		drag_is_container (el) {
			return el.classList.contains("draggable-container")
		},
		drag_moves(el, source, handle, sibling) { //fires first
			if (el.classList.contains("draggable")) {
				this.d.element = this.get_draggabled_element_info(el, source)
				this.d.element.dragging = true
				return true
			} 
			return false
		},
		drag_accepts(el, target, source, sibling) { //fires after over
			
			this.d.target_container = this.get_target_container_info(target)
			let target_container = this.d.target_container
			let element = this.d.element

			//DRAGGING TO...
			switch (target_container.type) {
				//LIST
				case "shortcut": {
					if (["command-entry", "key-entry", "bin-entry"].includes(element.type)) { return false }
					return true
				}
				case "command": {
					if (element.type == "shortcut-entry") { return false }
					return true
				}
				case "contexts": {
					if (element.type == "contexts-bar-entry") { return true }
					return false
				}
				case "contexts-bar-container": {
					if (["contexts-bar-entry", "context-entry"].includes(element.type)) {
						return false
					} if (element.entry.contexts.includes(target.children[0].innerText.toLowerCase())) {
						return false
					}
					return true
				}
				//KEYS
				case "key-container": {
					if (element.type == "shortcut-entry") { return false }
					if (["contexts-bar-entry", "context-entry"].includes(element.type)) {
						if (target_container.is_filled && !target_container.entry.contexts.includes(el.innerText.toLowerCase())) {
							return true
						}
						return false
					}
					if (target_container.is_block_alone) {return false}
					if (target_container.is_block_all) {return false}
					if (this.blocked_singles) {return false}
					return true
				}
				//BINS
				case "bin": {
					if (["context", "context-entry", "contexts-bar-entry", "bin-entry"].includes(element.type)) { return false }
					return true
				}
				case "delete-bin": {
					return true
				}
			}
		},
		drag_not_accepted(el, target, source, sibling) {
			//drag_on_out won't trigger when dragging in out of unaccepted containers
			this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
			this.$el.querySelectorAll(".hovering").forEach(el => el.classList.remove("hovering"))
			if (source !== target) {
				if (this.d.target_container.type !== "contexts-bar-container") {
					target.classList.add("unselectable")
				} else {
					target.children[0].classList.add("unselectable")
				}
			}
			
		},
		drag_on_over(el, target, source) {
			// check we actually moved over a different target
			if (this.d.last_target !== target) {
				this.d.last_target = target
				this.d.target_container = this.get_target_container_info(target)
				let target_container = this.d.target_container
				let element = this.d.element

				//clean classes that sometimes neither drag_on_out or drag_not_accepted catch these
				this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

				//added needed classes
				if (target_container.type == "key-container") {
					let existing = target.querySelector(".key-entry:not(.gu-transit)")
					if (existing) {
						if (["key-entry", "command-entry", "bin-entry"].includes(element.type)) {
							el.classList.add("will_replace")
							existing.classList.add("will_be_replaced")
						}
						if (["contexts-bar-entry", "context-entry"].includes(element.type)) {
							el.classList.add("will_replace")
							existing.classList.add("will_be_added_context")
						}
					}
				}

				if (target_container.is_list) {
					if (["key-entry", "command-entry", "bin-entry"].includes(element.type)) {
						let existing = target.querySelector(".list-entry:not(.gu-transit)")
						if (existing) {
							el.classList.add("will_replace")
							existing.classList.add("will_be_replaced")
						}
						
					}
					if (["contexts-bar-entry", "context-entry"].includes(element.type) && target !== source) {
						el.classList.add("will_replace")
						target.classList.add("will_be_added_context")
					}
				}

				if (target_container.type == "delete-bin") {
					target.classList.add("hovering")
				} else {
					//css doesn't handle hover when dragging
					this.$el.querySelectorAll(".hovering").forEach(el => el.classList.remove("hovering"))
				}
				if (target_container.type == "contexts-bar-container") {
					target.children[0].classList.add("will_be_added_context")
				}
			}
		},
		drag_on_drop(el, target, source, sibling) {
			this.d.target_container = this.get_target_container_info(target)
			let target_container = this.d.target_container
			let element = this.d.element
			
			if (target_container.type == "key-container" || target_container.is_list) {
				let new_entry = {
					shortcut: target_container.shortcut.map(keyset => this.normalize(keyset).join("+")).join(" "),
					_shortcut: target_container.shortcut, //optional
				}
				if (element.type == "bin-entry"){
					if (target_container.is_filled) {
						//add existing shortcut to bin
						this.add_to_bin(target_container.entry)
					}
					this.move_from_bin(element.bin_index, new_entry)
				} else if (["context-entry", "contexts-bar-entry"].includes(element.type)) {
					let change = {
						old_entry: target_container.entry,
						new_entry: {...target_container.entry, contexts:_.uniq([...target_container.entry.contexts, el.innerText])}
					}
					this.shortcut_edit(change)
				} else {
					new_entry.command = element.entry.command
					let change = {
						old_entry: element.entry,
						new_entry: new_entry
					}
					this.shortcut_edit(change)
				}
			}
			if (target_container.type == "bin") {
				this.add_to_bin(element.entry)
			}
			if (target_container.type == "delete-bin") {
				if (["key-entry", "shortcut-entry", "command-entry"].includes(element.type)) {
					this.$emit("delete", element.entry)
				}
			}
			if (target_container.type == "contexts-bar-container") {
				let change = {
					old_entry: element.entry,
					new_entry: {...element.entry, contexts: _.uniq([...element.entry.contexts, target.children[0].innerText.toLowerCase()])}
				}
				this.shortcut_edit(change)
			}
			//we don't actually want to drop the element and change the dom, vue will handle rerendering it in the proper place
			this.drake.cancel()
			this.d = {}
		},
		drag_on_cancel() {
			this.freeze = false
			//in case we missed any, set dragging to false on all
			this.shortcuts.map(entry => entry.dragging = false)
			this.bin.map(entry => entry.dragging = false)
			//sometimes drag_on_out doesn't reset them properly
			this.drag_reset_all_classes()
		},
		drag_on_out(el, container, source) {
			this.drag_reset_all_classes()
			//because sometimes the drag_on_over will have already triggered
			//and we'll accidently delete the new classes, this will make it let it
			//past the first condition that reduces how many times it's called
			this.d.last_target = undefined
			
		},
		drag_reset_all_classes() {
			this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
			this.$el.querySelectorAll(".will_be_added_context").forEach(el => el.classList.remove("will_be_added_context"))
			this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
			this.$el.querySelectorAll(".hovering").forEach(el => el.classList.remove("hovering"))
		}
	},
})