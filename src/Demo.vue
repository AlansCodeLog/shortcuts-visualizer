<template>
	<div id="Demo">
		<Shortcut_Visualizer
			v-bind="visualizer_options"
		></Shortcut_Visualizer>
		{{visualizer_options.options_user.theme_dark}}
		<button @click="toggle()">Toggle Theme from Parent</button>
	</div>
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
				keyboard_layout: layout,
				keys_list: keys,
				shortcuts_list: shortcuts,
				commands_list: commands,
				options_dev: {
					timeout: 3000,
				},
				options_user: {
					modifiers_order: modifiers_order,
					theme_dark: false,
				}
			}
		}
	},
	methods: {
		toggle () {
			this.visualizer_options.options_user.theme_dark = !this.visualizer_options.options_user.theme_dark
			console.log(this.visualizer_options.options_user.theme_dark)
			
		}
	}
}
</script>
<style lang="scss">
body {
	margin: 0;
	font-family: Arial, sans-serif;
	background: darkgray;
}
#Demo > button {
	text-align: center;
	display: block;
	border: 2px solid rgb(77, 77, 77);
	padding: 5px;
	margin: 30px auto;
	background: lightgray;
	&:hover {
		cursor: pointer;
		color: rgb(0, 110, 255);
		border-color: rgb(0, 110, 255);
	}
}
</style>