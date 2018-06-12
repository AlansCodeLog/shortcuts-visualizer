<template>
	<div
		tabindex="-1"
		:class="['shortcut-visualizer', options.theme_dark ? 'background-dark' : 'background-light']"
	>
		<Options
			@input="change('options', $event)"
			:modes="modes"
			:options="options"
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
			:keymap_active="keymap_active"
			:keys="keys"
			:layout="layout"
			:modifiers_names="modifiers_names"
			:modifiers_order="modifiers_order"
			:normalize="normalize"
			:shortcuts="shortcuts"
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
				:chain="chain"
				:commands="commands"
				:keymap="keymap"
				:keymap_active="keymap_active"
				:modifiers_names="modifiers_names"
				:modifiers_order="modifiers_order"
				:options="options"
				:shortcuts="shortcuts"
				:shortcuts_active="shortcuts_active"
				:shortcuts_list_active="shortcuts_list_active"
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
			:chain="chain"
			:commands="commands"
			:contexts="contexts"
			:keymap="keymap"
			:modifiers_names="modifiers_names"
			:modifiers_order="modifiers_order"
			:normalize="normalize"
			:options="options"
			:shortcuts="shortcuts"
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
import {create_keymap, create_shortcuts_list, get_shortcuts_active, normalize} from "./helpers/helpers"
import {drag_handlers} from "./mixins/drag"
import {shortcut_editing_handlers} from "./mixins/shortcut_editing"
import {input_handlers} from "./mixins/input"

export default {
	name: "Shortcut-Visualizer",
	props: ["ops"],
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
		input_handlers
	],
	data() {  
		return {
			//will be set by props (handled in created)
			layout: [], //layout,
			keys: {}, //keys,
			keymap: {}, //keymap,
			modifiers_names: [], //modifiers_names,
			modifiers_order: [], //modifiers_order,
			shortcuts: [], //shortcuts_list,
			contexts: [], //context_list,
			active_context: "", //for context-bar, set by options
			commands: [], //commands
			timeout: 3000,
			//private to component
			modes: ["As Pressed", "Toggle Modifiers", "Toggle All"],
			chain: {
				//allow: true,
				in_chain: false,
				start: [],
				last: [],
				warning: false,
			},
			//todo allow hiding/overiding by props
			options: {
				mode: "Toggle All",
				theme_dark: true,
				accept_on_blur: true,
				allow_tab_out: false,
				default_context: "global",
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
	},
	computed: {
		keymap_active () {
			return Object.keys(this.keymap).filter(identifier => {
				let key = this.keymap[identifier]
				return key.active
			}).sort()
		},
		blocked_singles() {
			let blocked_modifiers = []
			//set limit to check length again because we might have 2 blocked single keys pressed
			//in which case it's allowed
			//but the following function might give us an array of 2 blocked modifiers
			//which if they are right/left means we have to up the limit to 2
			let limit = 1 
			let unblocked_modifiers = this.get_active_modifiers().filter(keyname => {
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
		shortcuts_active () {
			return get_shortcuts_active (this, false)
		},
		shortcuts_list_active () {
			return get_shortcuts_active (this, true)
		},
	},
	methods: {
		//make normalize accesible to template
		normalize (identifiers) {
			return normalize(identifiers, this)
		},
		//set property by key (used to set freeze and options)
		change (key, data) {
			this[key] = data
		},
		//display error messages to user
		set_error(error, timeout_multiplier = 1) {
			this.error_message = error.message
			setTimeout(() => {
				this.error_message = false
			}, this.timeout * timeout_multiplier)
		},
		get_active_modifiers() {
			return _.intersection(this.modifiers_names, this.keymap_active)
		},
		//TODO list mixin methods
	},
	created() {
		//TODO? wrap in another compenent that watches for changes to options but allows this component to name them as it likes
		let {layout, keys, shortcuts, commands, timeout} = this.ops
		
		//they won't be reactive if they aren't cloned
		layout = _.cloneDeep(layout)
		keys = _.cloneDeep(keys)
		shortcuts = _.cloneDeep(shortcuts)
		commands = _.cloneDeep(commands)
		timeout = _.cloneDeep(timeout)
		
		this.layout = layout
		this.keys = keys
		// this.block_singles
		this.keymap = create_keymap(this.keys)
		this.modifiers_names = _.uniq(Object.keys(this.keymap).filter(identifier => this.keymap[identifier].is_modifier).map(identifier => this.keymap[identifier].identifier))
		this.modifiers_order = ["ctrl", "shift", "alt"]
		
		let lists = create_shortcuts_list(shortcuts, this)
		this.shortcuts= lists.shortcuts_list
		this.contexts = lists.context_list.map(entry => entry = entry.toLowerCase()).sort()
		this.commands = commands
		this.active_context = this.options.default_context
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
