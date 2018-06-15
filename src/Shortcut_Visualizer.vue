<template>
	<div
		tabindex="-1"
		:class="['shortcut-visualizer', user_options.theme_dark ? 'background-dark' : 'background-light']"
	>
		<Options
			@input="change('options', $event)"
			:modes="modes"
			:options="user_options"
		></Options>
		<contexts-bar
			tabindex="0"
			:contexts="contexts"
			:active="active_context"
			@change="change('active_context', $event)"
		></contexts-bar>
		<!-- tabindex is one because once you're here you can't escape -->
		<Keys
			tabindex="0" 
			@keydown="keydown($event)"
			@keyup="keyup($event)"
			:chain="chain"
			:keymap="keymap"
			:keys="keys"
			:layout="layout"
			:shortcuts_active="shortcuts_active"
			:blocked_singles="blocked_singles"
		></Keys>
		<!-- tells us what's being pressed, whether we're waiting for a chain, etc -->
		<Status
			:keymap_active="keymap_active"
			:chain="chain"
			:blocked_singles="blocked_singles"
			:error_message="error_message"
			:normalize="normalize"
		></Status>
		<div class="bins">
			<Bin
				tabindex="0"
				:bin="bin"
			></Bin>
			<div tabindex="0" class="draggable-container delete-bin"></div>
		</div>
		<ShortcutsList
			tabindex="0"
			@add="shortcut_add($event)"
			@error="set_error($event)"
			@delete="delete_entry($event)"
			@edit="shortcut_edit($event)"
			@freeze="change('freeze', $event)"
			:commands="commands"
			:contexts="contexts"
			:keymap="keymap"
			:normalize="normalize"
			:options="user_options"
			:shortcuts_list_active="shortcuts_list_active"
		></ShortcutsList>
	</div>
</template>

<script>
import ContextsBar from "./components/contexts"
import Options from "./components/options"
import Keys from "./components/keys"
import Status from "./components/status"
import Bin from "./components/bin"
import ShortcutsList from "./components/shortcut_list"


import * as _ from "lodash"
import dragula from "dragula"
import {drag_handlers} from "./mixins/drag"
import {shortcut_editing_handlers} from "./mixins/shortcut_editing"
import {input_handlers} from "./mixins/input"
import {helpers} from "./mixins/helpers"

export default {
	name: "Shortcut-Visualizer",
	props: {
		shortcuts_list: {
			type: Array,
			required:true,
		},
		keyboard_layout: {
			type: Array,
			required: true,
		},
		keys_list: {
			type: Object,
			required: true,
		},
		commands_list: {
			type: Array,
			required: true,
		},
		options_user: {
			type: Object,
			required:  false,
		},
		options_dev: {
			type: Object,
			required: false,
		}
	},
	components: {
		ContextsBar,
		Options,
		Keys,
		Status,
		Bin,
		ShortcutsList
	},
	mixins: [
		//most of the logic of the component lives in one of the following mixins
		drag_handlers,
		shortcut_editing_handlers,
		input_handlers,
		helpers
	],
	data() {  
		return {
			//will be set by props (handled in created)
			layout: [], //layout,
			keys: {}, //keys,
			keymap: {}, //keymap,
			modifiers_names: [], //modifiers_names,
			shortcuts: [], //shortcuts_list,
			contexts: [], //context_list,
			active_context: "", //for context-bar, set by options
			commands: [], //commands
			//also will be set by props if overriden, else these are the defaults
			user_options: {
				mode: "Toggle All",
				theme_dark: true,
				accept_on_blur: true,
				allow_tab_out: false,
			},
			dev_options: {
				timeout: 3000,
				timeout_chain_warning: 1000,
				timeout_no_key_down: 3000/10,
				timeout_edit_success: 3000/10,
				default_context: "global",
				modifiers_order: [] //there is no default order as we don't know what they're actually being called
				//will get filled in created using modifiers_names if nothing is passed
			},
			//private to component
			modes: ["As Pressed", "Toggle Modifiers", "Toggle All"],
			chain: {
				//allow: true,
				in_chain: false,
				start: [],
				last: [],
				warning: false,
			},
			mods_unknown: true,
			freeze: false,
			bin: [],
			error_message: false
		}
	},
	watch: {
		//handles the chain state
		"keymap_active" (newactive) {
			this.watch_keymap_active(newactive)
		},
		"options_user": {
			handler: function (new_value) {
				this.process_options(new_value, "user_options")
			},
			deep: true,
		},
		"options_dev": {
			handler: function (new_value) {
				this.process_options(new_value, "dev_options")
			},
			deep: true,
		}
	},
	computed: {
		keymap_active () {
			return Object.keys(this.keymap).filter(identifier => {
				let key = this.keymap[identifier]
				return key.active
			}).sort()
		},
		blocked_singles() {
			return this.get_blocked_singles(this.get_active_modifiers())
		},
		shortcuts_active () {
			return this.get_shortcuts_active (false)
		},
		shortcuts_list_active () {
			return this.get_shortcuts_active (true)
		},
	},
	methods: {
		//not sure why mixing throws error
		normalize (identifiers) {
			return this._normalize(identifiers)
		},
		//set property by key (used to set freeze and options)
		change (key, data) {
			this[key] = data
		},
		//display error messages to user
		set_error(error) {
			this.error_message = error.message
			setTimeout(() => {
				this.error_message = false
			}, this.dev_options.timeout_error)
		},
		get_active_modifiers() {
			return this.keymap_active.filter(key => this.keymap[key].is_modifier)
		},
		process_options(new_value, type) {
			for (let key in this[type]) {
				if (new_value[key] !== undefined) { //mix in with defaults (using props defaults function doesn't mix the properties)
					this[type][key] = new_value[key]
				}
			}
		}
		//TODO list mixin methods
	},
	created() {
		//TODO emit changes back
		//note properties won't be reactive sometimes if they aren't cloned/copied, that's why all the clone deep
		//also we don't want to modify the parent props, all modifications should be emitted up.


		if (this.options_user !== undefined) {
			this.process_options(this.user_options, "user_options")
		}
		if (this.options_dev !== undefined) { //TODO
			this.process_options(this.dev_options, "dev_options")
		}
		
		this.layout = _.cloneDeep(this.keyboard_layout)
		this.keys = _.cloneDeep(this.keys_list)
		this.commands = _.cloneDeep(this.commands_list)

		
		this.keymap = this.create_keymap()
		this.modifiers_names = _.uniq(Object.keys(this.keymap).filter(identifier => this.keymap[identifier].is_modifier).map(identifier => this.keymap[identifier].identifier)).sort()
		let lists = this.create_shortcuts_list(_.cloneDeep(this.shortcuts_list), this)
		this.shortcuts= lists.shortcuts_list
		this.contexts = lists.context_list.map(entry => entry = entry.toLowerCase()).sort()
		this.active_context = this.dev_options.default_context

		if (this.options_dev.modifiers_order == undefined || this.options_dev.modifiers_order.length == 0) {
			this.dev_options.modifiers_order = _.uniq(this.modifiers_names.map(identifier => this.keymap[identifier].character)).sort()
		}
	},
	mounted () {
		this.drag_init()
	}
}
</script>

<style lang="scss">

.shortcut-visualizer {
	@import "./settings/theme.scss";
	@import "./settings/custom_dragula.scss";
	padding: $padding-size;
	&.background-light {
		background: $theme-light-background;
		color: invert($theme-light-background);
		input {
			color: invert($theme-light-background);
		}
	}
	&.background-dark {
		background: $theme-dark-background;
		color: invert($theme-dark-background);
		input {
			color: invert($theme-dark-background);
		}
	}

	.bins {
		display:flex;
		margin: $padding-size;
		justify-content: space-between;
		.temp-bin {
			flex: 0 1 70%;
		}
		.delete-bin {
			flex: 0 1 30%;
			margin-left: $padding-size;
			align-self: stretch;
			background: transparentize(red, 0.7);
			border: transparentize(red, 0.7) 0.2em solid;
			display: flex;
			justify-content: center;
			align-items: center;
			&.hovering::after {
				content: "DELETE";
				color: red;
				font-size: 2em;
			}
			.gu-transit {
				display: none;
			}
		}
	}
}
</style>
