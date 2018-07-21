export default {
	methods: {
		// handles the chain state
		// again actually moving the entire watch function here creates problems
		watch_keymap_active(newactive) {
			if (this.chain.in_chain) {
				let none_modifiers_pressed =
					newactive.filter(
						identifier => !this.keymap[identifier].is_modifier
					).length > 0
						? true
						: false
				// is there are keys being pressed that aren't modifiers that have not shortcuts
				if (
					newactive.length > 0 &&
					none_modifiers_pressed &&
					this.shortcuts_active.length == 0
				) {
					this.toggle_chain({ in_chain: false, warning: [...newactive] })
				}
			} else {
				let trigger_chain = this.chain_in_active()
				if (trigger_chain) {
					this.toggle_chain(trigger_chain)
				}
			}
		},
		// helper for above
		chain_in_active () { // second argument is spreading this
			let chain = this.shortcuts_active.filter(entry => {
				if (!entry.chained
					&& entry.chain_start
					&& entry._shortcut[0].length == this.keymap_active.length
					&& this.difference(entry._shortcut[0], this.keymap_active).length == 0
				) {
					return true
				} else {return false}
			})
			if (chain.length > 0) {
				return { in_chain: true, start: [...this.keymap_active], shortcut: chain[0].shortcut, warning: false }
			} else {return false}
		},
		// handles the chain state and setting chain not found error
		toggle_chain(data) {
			this.chain = { ...this.chain, ...data }
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
				}, this.dev_options.timeout_chain_warning)
			}
		},
		// handles keypresses
		keydown(e) {
			let identifier = e.code
			if (
				identifier !== "Tab" ||
				(identifier == "Tab" && !this.user_options.allow_tab_out)
			) {
				e.preventDefault()
				e.stopPropagation()
				if (this.freeze) {
					this.set_error({ message: "Input on keyboard is frozen while dragging or editing." })
					return
				}
				if (this.user_options.mode == "Toggle All") {
					this.keymap[identifier].active = !this.keymap[identifier].active
				} else if (this.user_options.mode == "Toggle Modifiers") {
					if (this.keymap[identifier].is_modifier) {
						this.keymap[identifier].active = !this.keymap[identifier]
							.active
					} else {
						this.keymap[identifier].active = this.keymap[identifier]
							.fake_toggle
							? !this.keymap[identifier].active
							: true
					}
				} else {
					this.keymap[identifier].active = this.keymap[identifier]
						.fake_toggle
						? !this.keymap[identifier].active
						: true
				}
				this.keypress_set_mods(e, identifier)
				this.keypress_set_RL(e, identifier)
				this.$emit("input", this.keymap)
			}
		},
		keyup(e) {
			let identifier = e.code
			e.preventDefault()
			e.stopPropagation()
			if (this.freeze) {
				return
			}
			if (this.keymap[identifier].nokeydown) {
				this.keymap[identifier].active = this.keymap[identifier].fake_toggle
					? !this.keymap[identifier].active
					: true
				this.keymap[identifier].timer = setTimeout(() => {
					this.keymap[identifier].active = this.keymap[identifier]
						.fake_toggle
						? this.keymap[identifier].active
						: false
				}, timeout_no_key_down)
			} else {
				if (this.user_options.mode == "Toggle Modifiers") {
					if (!this.keymap[identifier].is_modifier) {
						this.keymap[identifier].active = this.keymap[identifier]
							.fake_toggle
							? this.keymap[identifier].active
							: false
					} else {
						this.keymap[identifier].active = this.keymap[identifier]
							.fake_toggle
							? !this.keymap[identifier].active
							: false
					}
				} else if (this.user_options.mode !== "Toggle Modifiers") {
					this.keymap[identifier].active = this.keymap[identifier]
						.fake_toggle
						? !this.keymap[identifier].active
						: false
				}
				this.keypress_set_mods(e, identifier)
			}
			this.keypress_set_RL(e, identifier)
			this.$emit("input", this.keymap)
		},
		// small helpers for handling keypresses
		// sets the state of special keys like numlock
		keypress_set_mods(e, identifier) {
			if (this.mods_unknown) {
				this.keymap["CapsLock"].active = e.getModifierState("CapsLock")
				this.keymap["NumLock"].active = e.getModifierState("NumLock")
				this.keymap["ScrollLock"].active = e.getModifierState("ScrollLock")
				this.mods_unknown = false
			} else if (this.keymap[identifier].toggle) {
				this.keymap[identifier].active = e.getModifierState(identifier)
			}
		},
		// makes both left and right versions of a key active
		keypress_set_RL(e, identifier) {
			if (this.keymap[identifier].RL == true) {
				if (identifier.indexOf("Right") !== -1) {
					this.keymap[
						identifier.replace("Right", "Left")
					].active = this.keymap[identifier].active
				} else {
					this.keymap[
						identifier.replace("Left", "Right")
					].active = this.keymap[identifier].active
				}
			}
		},
		get_shortcuts_active (show_unpressed_modifiers = false) {
			// params for functions used, to clean things up a bit
			let result = this.shortcuts.filter(entry => {
				if (entry.binned || !entry.contexts.includes(this.active_context)) {return false}
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
				} else if (this.chain.in_chain && entry.chained && this.is_equal(entry._shortcut[0], this.chain.start)) {
					// TODO this is almost same check as first
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

			if (show_unpressed_modifiers) {
				return result.sort((a, b) => {
					return a.shortcut > b.shortcut
				})
			}

			return result
		},
		// helpers for above
		find_extra_modifiers(shortcut_entry) {
			return this.difference(shortcut_entry, this.keymap_active).filter(identifier => { // the order of difference matters
				if (this.keymap[identifier].is_modifier) {return true}
			})
		},
		find_extra_keys_pressed(shortcut_entry) {
			return this.difference(this.keymap_active, shortcut_entry).filter(identifier => {// the order of difference matters
				if (!shortcut_entry.includes(identifier)) {return true}
			})
		},
	}
}
