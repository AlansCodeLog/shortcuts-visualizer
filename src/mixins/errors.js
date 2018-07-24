export default {
	// ["shortcut undefined", "shortcut empty", "invalid contexts type", "multiple non-modifiers", "blocked_alone", "blocked_single", "blocked_all", "duplicate shortcut", "chain error", "should be chain", "invalid chain length", "unknown key"]
	methods: {
		create_error(type, context) {
			let error = new Error()
			error.context = context
			error.code = type
			return error
		},
		validate_error(type, error, extra_context = {}) {
			let context = { ...error.context, ...extra_context }

			// BASE ERRORS

			switch(error.code) {
				// create_shortcut_entry
				case "shortcut undefined" : {
					error.message = `Shortcut property missing:\n${context.entry}`
				} break
				case "shortcut empty" : {
					error.message = `Shortcut cannot be empty:\n${context.entry}`
				} break
				case "missing contexts" : {
					error.message = `Entry contexts cannot be empty:\n ${context.entry}`
				} break
				case "invalid contexts type" : {
					error.message = `Entry contexts: ${context.entry.contexts} must be an array. See shortcut: ${context.entry.shortcut} for command: ${context.entry.command}`
				} break
				case "invalid chained chain start" : {
					error.message = `A chained entry cannot be a chain start: \n${context.entry}`
				} break
				// keys_from_text
				case "invalid chain length" : {
					error.message = `Program only supports two part chains. Shortcut "${context.shortcut_text}" contains ${context.shortcut.length}, interpreted as: [${context.shortcut.join(", ")}].`
				} break
				case "unknown key" : {
					error.message = `Unknown key: ${context.key}`
				} break
				// create_shortcut_entry - blocking related
				case "multiple non-modifiers": {
					error.message = `Invalid shortcut ${context.entry.shortcut}. Shortcuts cannot contain multiple non-modifiers: ["${this.normalize(context.non_modifiers).join(", ")}"]`
				} break
				case "blocked alone" : {
					error.message = `Invalid shortcut ${context.entry.shortcut}. Shortcuts with just ["${this.normalize(context.blocked_alone).join(", ")}"] as their only key/s are blocked.`
				} break
				case "blocked single" : {
					error.message = `Invalid shortcut ${context.entry.shortcut} Shortcuts containing only ["${this.normalize(context.blocked_singles).join("")}"] as a modifier are blocked.`
				} break
				case "blocked all" : {
					error.message = `Invalid shortcut "${context.entry.shortcut}". Shortcuts cannot contain keys: ["${this.normalize(context.blocked_all).join(", ")}"], assignments to the keys are blocked.`
				} break
			}
			if (type == "init") {
				switch(error.code) {
					case "duplicate shortcut":
					case "duplicate chain start" : {
						error.message = `Shortcut "${context.entry.shortcut}" (command: "${context.entry.command}") already exists: "${context.existing_entry.shortcut}" (command: "${context.existing_entry.command}")`
						return
					}
					case "chain error new":
					case "chain error existing" : {
						error.message = `Shortcut "${context.entry.shortcut}" is the start of a chain. It cannot be overwritten for command "${context.entry.command}". If you'd like to just change the command text, chain_start must be set to true for the shortcut.`
						return
					}
					case "should be chain existing":
					case "should be chain new": {
						error.message = `Shortcut "${context.entry.shortcut}" should be a chain_start but it isn't.`
						return
					}
				}
			}
			if (type == "validate") {
				// change messages
				if (error.code == "shortcut empty")  {
					error.message = `Entry shortcut cannot be empty.`
					return
				}
				if (error.code == "missing contexts")  {
					error.message = `A context wasn't specified, setting to global.`
					return
				}

				let { index, editing_existing } = context

				if (!editing_existing) {
					switch (error.code) {
						case "chain error new":
						case "chain error existing":
						case "should be chain new" : {
							error.message = `Shortcut ${context.entry.shortcut} is a chain start. It cannot be overwritten.`
						} break
						case "should be chain existing":
						case "regular error": {
							error.message `Shortcut ${context.entry.shortcut} already exists. It cannot be overwritten.`
						} break
					}
				// editing and error is with same entry
				} else if (error.context.index == index) {
					if (error.code == "chain error new" || error.code == "should be chain existing") { // todo check latter works
						// check can be unchained
						let chain_start = this.shortcuts[index]._shortcut[0]
						let chain_count = this.shortcuts.reduce((count, entry) => {
							if (!entry.chain_start && chain_start.join("") == entry._shortcut[0].join("")) {
								return count + 1
							} else {return count + 0}
						}, 0)
						if (chain_count > 0) {
							error.message = `Shortcut ${context.entry.shortcut} is a chain start with ${chain_count} dependent chains. It cannot be unchained.`
						}
					}
				// editing and error is not with same entry
				} else {
					if (error.code == "chain error new" || error.code == "chain error existing") {
						// is existing chain start
						error.message = `Shortcut ${context.entry.shortcut} already exists. It cannot be overwritten.`
					}

					// would require creating chain start and shortcut is taken
					if (error.code == "should be chain existing") {
						error.message `Creating this chained shortcut would require creating a chain start at ${this.normalize(context.entry._shortcut[0])} but that shortcut already exists for command ${context.entry.command}.`
					}
				}
			}
		}
	}
}