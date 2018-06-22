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
		normalize(identifiers) {
			if (identifiers.length == 0) {
				return []
			}
			let keys = identifiers.map(identifier => {
				return this.keymap[identifier].name
			})
			keys = _.uniq(keys)
			let keys_mods = keys
				.filter(key => {
					return this.modifiers_order.includes(key)
				})
				.sort((a, b) => {
					return (
						this.modifiers_order.indexOf(a) -
						this.modifiers_order.indexOf(b)
					)
				})
			let keys_none_mods = _.xor(keys, keys_mods)
			keys = [...keys_mods, ...keys_none_mods]

			//capitalize keys
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
		keys_from_text(shortcut) {
			// split into parts, when there's more than two there's a chain
			shortcut = shortcut.split(" ").filter(entry => entry !== "")
			//get the keys array
			//normalize the - or + separator
			//and replace name of right/left keys with generic name
			let _shortcut = shortcut.map((keyset, index) => {
				let keys = keyset
					.replace(/(\+|-)(?=\1|[\s\S])/gm, "==BREAK==")
					.split("==BREAK==")
				shortcut[index] = _.pull(keys, "==BREAK==").join("+")
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
				return _.pull(keys, "==BREAK==")
			})
			//normalize key names and create string shortcut property
			shortcut = [this.normalize(_shortcut[0].sort()).join("+")]
			if (_shortcut.length > 1) {
				shortcut.push(this.normalize(_shortcut[1].sort()).join("+"))
			}
			return { shortcut: shortcut.join(" "), _shortcut: _shortcut }
		},
		get_blocked_singles(modifiers) {
			
			let blocked_modifiers = []
			//set limit to check length again because we might have 2 blocked single keys pressed
			//in which case it's allowed
			//but the following function might give us an array of 2 blocked modifiers
			//which if they are right/left means we have to up the limit to 2
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
