<template>
	<div
		id="Demo"
		:class="[visualizer_options.options_user.theme_dark ? 'dark' : 'light']"
	>	
		<div class="view-wrapper">
			<Shortcut_Visualizer
				:class="{manual_font_size: manual_visualizer_font_size}"
				:style="{fontSize: manual_visualizer_font_size ? visualizer_font_size : undefined}"
				ref="shortcut_visualizer"
				v-bind="visualizer_options"
				@change="handle_change($event)"
				@warning="handle_warning($event)"
				@ready="handle_ready($event)"
				@options="handle_options($event)"
			></Shortcut_Visualizer>
			<div class="buttons">
				<button @click="toggle_theme()">Toggle Theme from Parent</button>
				<button @click="toggle_options()">Toggle Options from Parent</button>
				<button @click="toggle_manual_visualizer_font_size()">Toggle Manual Font Size</button>
				<button @click="fetch()">Test Direct Fetch</button>
				<button @click="clear_all()">Clear All Messages</button>
			</div>
			<div class="demo_options">
				<div v-if="manual_visualizer_font_size">
					<label>Keyboard Font Size</label>
					<input v-model="visualizer_font_size"/>
				</div>
				<div>
					<label>Output Font Size</label>
					<input v-model="font_size"/>
				</div>
			</div>
		</div>
		<div v-if="change || warning || ready || data" class="messages" :style="`font-size:${font_size}`">
			<div v-if="change" class="change">{{beautify(change)}}</div>
			<div v-if="warning" class="warning">{{beautify(warning)}}</div>
			<div v-if="ready" class="ready">{{beautify(ready)}}</div>
			<div v-if="data" class="data">{{beautify(data)}}</div>
		</div>
	</div>
</template>

<script>
import Shortcut_Visualizer from "./Shortcut_Visualizer"
import {layout} from "./settings/layout.js"
import {keys, modifiers_order} from "./settings/keys.js"
import {shortcuts, generator} from "./settings/shortcuts.js"
import {commands} from "./settings/commands.js"

export default {
	name: "Demo",
	components: {
		Shortcut_Visualizer,
	},
	data () {
		return {
			font_size: "0.7em",
			change: "",
			warning: "",
			ready: "",
			data: "",
			demo_timeout: 10000,
			manual_visualizer_font_size: false,
			visualizer_font_size: "1em",
			visualizer_options: {
				keys_list: keys,
				// shortcuts_list: shortcuts,
				shortcuts_list: generator(), //for testing
				layout: layout,
				order_of_modifiers: modifiers_order,
				options_user: {
					// mode: "Toggle All",
					theme_dark: true,
					// accept_on_blur: true,
					never_blur: true,
					// allow_tab_out: false,
					delete_empty_contexts: false,
				},
				options_dev: {
					// timeout: 3000,
					// timeout_error: 3000,
					// timeout_chain_warning: 3000,
					// timeout_no_key_down: 3000/10,
					// timeout_edit_success: 3000/10,
					// default_context: "global",
					// auto_capitalize_contexts: true,
					hide_options: false
				}
			}
		}
	},
	methods: {
		beautify (message) {
			return JSON.stringify(message, null, "\t")
		},
		toggle_manual_visualizer_font_size () {
			this.manual_visualizer_font_size = !this.manual_visualizer_font_size
		},
		toggle_theme () {
			this.visualizer_options.options_user.theme_dark = !this.visualizer_options.options_user.theme_dark
		},
		toggle_options () {
			this.visualizer_options.options_dev.hide_options = !this.visualizer_options.options_dev.hide_options
		},
		handle_options ([key, value]) {
			this.visualizer_options.options_user[key] = value
		},	
		handle_change (event) {
			console.log(event)
			this.change = event
			setTimeout(() => {
				this.change = ""
			}, this.demo_timeout)
		},
		handle_warning (event) {
			this.warning = event
			setTimeout(() => {
				this.warning = ""
			}, this.demo_timeout)
		},
		handle_ready (event) {
			// top keep demo value in sync you would have to:
			// this.visualizer_options.shortcuts_list = event.shortcuts_list
			// and also handle the changes in handle_change
			// will add this to the demo eventually
			this.ready = event
			setTimeout(() => {
				this.ready = ""
			}, this.demo_timeout)
		},
		fetch () {
			// to keep demo values in sync you would have to:
			// this.visualizer_options.shortcuts_list = event.shortcuts_list
			// and also handle the changes in handle_change

			// this is just an example of how to fetch data from the component properly
			// for if for example you only wanted to handle changes when the user saved their settings
			let deep_clone_entry = this.$refs.shortcut_visualizer.deep_clone_entry
			let shortcuts = this.$refs.shortcut_visualizer.shortcuts
			shortcuts = shortcuts.map(entry => deep_clone_entry(entry))
			this.data = shortcuts
			setTimeout(() => {
				this.data = ""
			}, this.demo_timeout)
		},
		clear_all () {
			this.change = ""
			this.warning = ""
			this.ready = ""
			this.data = ""
		}
	}
}
</script>
<style lang="scss">
html,
body {
	margin: 0;
	padding: 0;
}
body {
	font-family: Arial, sans-serif;
}
#Demo {
	&.dark{
		background: #2b2b2b;
		color: #f0f0f0;
		.view-wrapper {
			& > .buttons, & > .demo_options {
				& > div, & > button {
					background: rgba(0, 0, 0, 0.2);
				}
				& > button {
					border: 2px solid rgba(0, 0, 0, 0.2);
				}
			}
		}
	}
	&.light {
		color: #2b2b2b;
		background: #f0f0f0;
		.view-wrapper {
			& > .buttons, & > .demo_options {
				& > div, & > button {
					background: rgba(0, 0, 0, 0.1);
				}
				& > button {
					border: 2px solid rgba(0, 0, 0, 0.1);
				}
			}
		}
	}
	.view-wrapper {
		min-height: 100vh;
		height: 100vh;
		display: flex;
		flex-direction: column;
		& > div:not(.shortcut-visualizer) {
			flex: 0 0 auto;
		}
		.shortcut-visualizer { //is set internally to fill this and have the list auto scroll
			padding-bottom:0;
			flex: 1 1 auto;
			&.manual_font_size .keyboard {
				font-size: 1em; //will make keyboard use the parent div's em size
			}
		}
		
		& > .buttons, & > .demo_options {
			display: flex;
			justify-content: center;
			flex-wrap: wrap;
			& > div, & > button {
				box-sizing:border-box;
				font-size: 1em;
				text-align: center;
				display: block;
				margin: 5px;
			}
			& > button {
				color:inherit;
				padding: 5px;
				&:hover {
					cursor: pointer;
					background: rgba(45, 94, 255, 0.2);
					border-color: rgb(45, 94, 255);
				}
			}
			& > div {
				// width: 200px;
				display: flex;
				flex-direction: row;
				align-items: center;
				text-align: center;
				label {
					color:inherit;
					white-space: nowrap;
					padding: 5px;
					border: 2px solid transparent;
					display:block;
					// vertical-align: -0.1em;
				}
				input {
					flex: 0 1 50px;
					width: 50px;
					min-width: 0;
					text-align: center;
					align-self: stretch;
					padding: 5px;
					border: 2px solid transparent;
					font-size: 1em;
					margin: 0;
					border: 0;
					// position
				}
			}
		}
		.demo_options {
			padding-bottom: 15px;
		}
	}
	& > .messages {
		white-space: pre;
		padding:30px;
		.ready::before {
			display: block;
			content: "Ready:";
			font-weight: bold;
			margin-bottom:10px;
		}
		.data::before {
			display: block;
			content: "Data:";
			font-weight: bold;
			margin-bottom:10px;
		}
		.warning::before {
			display: block;
			content: "Warning:";
			font-weight: bold;
			margin-bottom:10px;
		}
		.change::before {
			display: block;
			content: "Change:";
			font-weight: bold;
			margin-bottom:10px;
		}
	}
}
</style>