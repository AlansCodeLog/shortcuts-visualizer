export default {
	methods: {
		// just pushes a new entry without any checks, this is because it's easier to do checks and warn the user about an error without changing a component's temporary state from within that component //todo? change
		bin_shortcut_add(entry) {
			entry.index = this.shortcuts.length
			entry.binned = true
			entry.bin_holder = this.bin_holder_index
			this.bin_holder_index += 1
			this.check_remove_contexts([entry]) // yes opposite of normal
			this.shortcuts.push(entry)
		},
		bin_delete_entry(entry) {
			this.$emit("change", { entries: [this.deep_clone_entry(entry)], type: "deleted" })
			this.shortcuts.splice(entry.index, 1)
			this.shortcuts.map((entry, index) => entry.index = index)
		},
		bin_shortcut_edit({ old_entry, new_entry }, is_hand_edit = false) {

			// if an entry was hand edited it should pass the same exact checks as a new entry
			if (is_hand_edit) {
				// fetch our entry
				var result = this.validate_entry(new_entry, false, "bin validate")
				// validate_entry will handle errors
				if (result === false) {return}
			}

			new_entry.contexts.sort()
			this.check_remove_contexts([old_entry])
			this.check_add_contexts([new_entry])

			if (!is_hand_edit) {
				var result = this.create_shortcut_entry(new_entry, true)
			}
			new_entry = result.entry || undefined
			// spread variables returned by result
			let { to_add, error } = result


			// if the shortcut is invalid (any keys are invalid or if a key is blocked)
			if (new_entry == undefined) {
				this.set_error(error)
				return
			}
		}
	}
}