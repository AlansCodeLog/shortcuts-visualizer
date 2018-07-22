export default {
	methods: {
		multisplice(array, indexes) {
			for (let i = 0; i < indexes.length; i++) {
				array.splice(indexes[i] - i, 1)
			}
		},
		capitalize(string) {
			if (!this.dev_options.auto_capitalize_contexts) {return string}
			return string.replace(/\b[a-z](?!\s)/g, (letter) => letter.toUpperCase())
		},
		sorted_merge_dedupe(arr, elements, clone = false) {
			if (clone) {
				array = arr.concat()
			} else {
				array = arr
			}
			let eli = 0
			for (let i = 0; i < array.length && eli < elements.length; i++) {
				let value = array[i]
				let element = elements[eli]
				if (element == value) {continue}
				if (element > value && element < array[i + 1]) {
					array.splice(i + 1, 0, element)
					eli++
				} else if (element > array[i - 1] && element < value) {
					array.splice(i, 0, element)
					eli++
					i--
				}
			}
			if (clone) {
				return array
			}
		},
		dedupe_presorted (array) {
			for (let i = 1; i < array.length; i++) {
				if (array[i] == array[i - 1]) {
					array.splice(i, 1)
					i = i - 1
				}
			}
			return array
		},
		deep_clone_entry(entry) {
			let clone = {
				shortcut: entry.shortcut,
				command: entry.command,
				chained: entry.chained,
				chain_start: entry.chain_start,
				contexts: Array.isArray(entry.contexts) ? entry.contexts.concat() : entry.contexts,
				_shortcut: entry._shortcut
					? [entry._shortcut[0].concat()]
					: entry._shortcut,
				editing: entry.editing,
				changed: entry.changed,
				dragging: entry.dragging,
				holder: entry.holder,
				index: entry.index
			}
			if (entry._shortcut && entry._shortcut.length > 1) {
				clone._shortcut[1] = entry._shortcut[1].concat()
			}
			return clone
		},
		is_equal(array_one, array_two) {
			if (array_one.length !== array_two.length) {return false}
			for (let i = 0; i < array_one.length; i++) {
				if (array_one[i] !== array_two[i]) {return false}
			}
			return true
		},
		difference(array_one, array_two) {
			let diff = []
			for (let entry of array_one) {
				if (array_two.indexOf(entry) == -1) {
					diff.push(entry)
				}
			}
			return diff
		},
		normalize(identifiers) {
			if (identifiers.length == 0) {
				return []
			}
			let keys_none_mods = []
			let keys_mods = []
			let keys = identifiers.map(identifier => {
				let name = this.keymap[identifier].name
				if (this.keymap[identifier].is_modifier) {
					keys_mods.push(name)
				} else {
					keys_none_mods.push(name)
				}
				return this.keymap[identifier].name
			})
			keys_mods.sort((a, b) => {
				return (
					this.modifiers_order.indexOf(a) -
					this.modifiers_order.indexOf(b)
				)
			})
			this.dedupe_presorted(keys_mods)
			this.dedupe_presorted(keys_none_mods.sort())

			keys = keys_mods.concat(keys_none_mods)

			// capitalize keys
			keys = keys.map(key => {
				for (let identifier of identifiers) {
					let key_info = this.keymap[identifier]
					if (key == key_info.name) {
						return key_info.character
					}
				}
				throw "Can't find key character " + key + " when normalizing."
			})
			return keys
		},
		keys_from_text(shortcut_text) {
			if (shortcut_text == "") {throw "Invalid"}
			// split into parts, when there's more than two there's a chain
			let shortcut = shortcut_text.split(" ").filter(entry => entry !== "")
			if (shortcut.length > 2) {throw `Program only supports two part chains. Shortcut "${shortcut_text}" contains ${shortcut.length}, interpreted as: [${shortcut.join(", ")}].`}
			// get the keys array
			// normalize the - or + separator
			let _shortcut = shortcut.map((keyset, index) => {

				let keys = keyset
					.split(/\+|-(?=\1|[\s\S])/gm)

				shortcut[index] = keys.join("+")
				let RL = []
				keys = keys.map(key => {
					let match = false
					key = key.toLowerCase()
					Object.keys(this.keymap).map(identifier => {
						let key_set = this.keymap[identifier]
						if (key_set.name == key) {
							key = identifier
							match = true
						}
					})
					if (match == false) {
						throw "Unknown key: " + key
					}
					if (this.keymap[key].RL == true) {
						RL.push(key)
					}
					return key
				})
				if (RL.length > 0) {
					RL.map(key => {
						if (key.indexOf("Right") !== -1) {
							keys.push(key.replace("Right", "Left"))
						} else {
							keys.push(key.replace("Left", "Right"))
						}
					})
				}
				return keys
			})
			// normalize key names and create string shortcut property
			shortcut = [this.normalize(_shortcut[0].sort()).join("+")]
			if (_shortcut.length > 1) {
				shortcut.push(this.normalize(_shortcut[1].sort()).join("+"))
			}
			return { shortcut: shortcut.join(" "), _shortcut: _shortcut }
		},
		get_blocked_singles(modifiers) {

			let blocked_modifiers = []
			// set limit to check length again because we might have 2 blocked single keys pressed
			// in which case it's allowed
			// but the following function might give us an array of 2 blocked modifiers
			// which if they are right/left means we have to up the limit to 2
			let limit = 1
			let unblocked_modifiers = modifiers.filter(keyname => {
				if (this.keymap[keyname].block_single) {
					blocked_modifiers.push(keyname)
					if (this.keymap[keyname].RL) {limit = 2}
				}
				return !this.keymap[keyname].block_single
			})
			if (blocked_modifiers.length == limit && unblocked_modifiers.length == 0) {
				return blocked_modifiers
			} else {
				return false
			}
		},
		get_active_modifiers() {
			return this.keymap_active.filter(key => this.keymap[key].is_modifier)
		},
	}
}
