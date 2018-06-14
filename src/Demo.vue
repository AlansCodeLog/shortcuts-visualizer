<template>
	<Shortcut_Visualizer
		:ops="visualizer_options"
	></Shortcut_Visualizer>
</template>

<script>
import Shortcut_Visualizer from "./Shortcut_Visualizer"
import {layout} from "./settings/layout.js"
import {keys, modifiers_order} from "./settings/keys.js"
import {shortcuts} from "./settings/shortcuts.js"
import {commands} from "./settings/commands.js"

export default {
	name: "Demo",
	components: {
		Shortcut_Visualizer,
	},
	data () {
		return {
			visualizer_options: {
				layout: layout,
				keys: keys,
				shortcuts: shortcuts,
				commands: commands,
				timeout: 3000,
				options: {
					modifiers_order: modifiers_order
				}
			}
		}
	}
}
</script>
<style>
body {
	margin:0;
	font-family: Arial, sans-serif;
}

</style>