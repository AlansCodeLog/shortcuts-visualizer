import Vue from "vue"

export const input_handlers = Vue.mixin({
	methods: {
		//handles the chain state
		//again actually moving the entire watch function here creates problems
		watch_keymap_active (newactive) {
			if (this.chain.in_chain) {
				let none_modifiers_pressed = newactive.filter(identifier => !this.keymap[identifier].is_modifier).length > 0 ? true : false
				//is there are keys being pressed that aren't modifiers that have not shortcuts
				if (newactive.length > 0 && none_modifiers_pressed && this.shortcuts_active.length == 0) {
					this.toggle_chain({in_chain: false, warning: [...newactive]})
				}
			} else {
				let trigger_chain = this.chain_in_active()
				if (trigger_chain) {
					this.toggle_chain(trigger_chain)
				}
			}
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
				}, this.timeout/3 * timeout_multiplier)
			}
		},
		//handles keypresses
		keydown (e) {
			let identifier = e.code
			if (identifier !== "Tab" || (identifier == "Tab" && !this.options.allow_tab_out)) {
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
				this.keypress_set_mods(e, identifier)
				this.keypress_set_RL(e, identifier)
				this.$emit("input", this.keymap)
			}
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
				}, this.timeout/10)
			} else {
				if (this.options.mode == "Toggle Modifiers") {
					if (!this.keymap[identifier].is_modifier){
						this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? this.keymap[identifier].active : false
					} else {
						this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? !this.keymap[identifier].active : false
					}
				} else if (this.options.mode !== "Toggle Modifiers"){
					this.keymap[identifier].active = this.keymap[identifier].fake_toggle ? !this.keymap[identifier].active : false
				}
				this.keypress_set_mods(e, identifier)
			}
			this.keypress_set_RL(e, identifier)
			this.$emit("input", this.keymap)
		},
		//small helpers for handling keypresses
		//sets the state of special keys like numlock
		keypress_set_mods (e, identifier) {
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
		keypress_set_RL (e, identifier) {
			if (this.keymap[identifier].RL == true) {
				if (identifier.indexOf("Right") !== -1) {
					this.keymap[identifier.replace("Right", "Left")].active = this.keymap[identifier].active
				} else {
					this.keymap[identifier.replace("Left", "Right")].active = this.keymap[identifier].active
				}
			}
		}
	}
})