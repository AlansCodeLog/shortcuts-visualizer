const shortcuts = [
	{
		shortcut: "ctrl+a",
		command: "Command A"
	},
	// {
	//    shortcut: "ctrl+q",
	//    command: "Command q"
	// },
	// {
	//    shortcut: "ctrl+shift+s",
	//    command: "Test Shift S"
	// },
	{
		shortcut: "ctrl+q",
		command: "Command Q",
		contexts: ["B"]
		// chain_start: true,
	},
	// {
	//    shortcut: "ctrl+s b",
	//    command: "Chained B"
	// },
	{
		shortcut: "ctrl+s",
		command: "Custom Chain Text S",
		chain_start: true,
	},
	{
		shortcut: "ctrl+b",
		command: "Custom Chain Text B",
		chain_start: true,
	},
	// {
	//    shortcut: "ctrl+s ctrl+a",
	//    command: "Chained Ctrl A"
	// },
	{
		shortcut: "ctrl+s s",
		command: "Command Chain S"
	},
	{
		shortcut: "ctrl+b b",
		command: "Command Chain B"
	},
	// {
	//    shortcut: "ctrl+s a",
	//    command: "Not detecting this duplicate"
	// },
]

function generator () {
	// let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
	// let mods = ["", "ctrl+", "ctrl+shift+", "alt+", "alt+shift+", "ctrl+alt+", "ctrl+alt+shift+"]
	let alphabet = ["q", "w", "e", "r", "z", "x", "c" , "v"]
	let mods = ["ctrl+"]
	let shortcuts = []

	for (let mod of mods) {
		for (let letter of alphabet.slice(4)) {
			shortcuts.push({shortcut:mod+letter, command: "Cmd. for " + mod+letter})
		}
		for (let letter of alphabet.slice(0, 4)) {
			shortcuts.push({shortcut:mod+letter + " " + letter, command: "Cmd. for " + mod+letter + " " + letter, chain_start: true})
		}
	}
	return shortcuts
}

export {shortcuts, generator}
