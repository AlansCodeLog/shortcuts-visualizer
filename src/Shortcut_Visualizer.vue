<template>
	<div
		tabindex="-1"
		:class="['shortcut-visualizer', user_options.theme_dark ? 'background-dark' : 'background-light']"
	>
		<Options
			v-if="!dev_options.hide_options"
			@change="$emit('options', $event)"
			v-bind="{modes}"
			:options="user_options"
		></Options>
		<contexts-bar
			tabindex="0"
			v-bind="{contexts, capitalize}"
			:active="active_context"
			@change="change('active_context', $event)"
		></contexts-bar>
		<!-- tabindex is one because once you're here you can't escape -->
		<Keys
			tabindex="0"
			@keydown="keydown($event)"
			@keyup="keyup($event)"
			v-bind="{chain, keymap, keys, layout, shortcuts_active, blocked_singles}"
		></Keys>
		<!-- tells us what's being pressed, whether we're waiting for a chain, etc -->
		<Status
			v-if="chain.warning || error"
			v-bind="{keymap_active, chain, blocked_singles, error, normalize}"
		></Status>
		<div class="bins">
			<Bin
				tabindex="0"
				v-bind="{bin}"
				@delete="delete_entry($event)"
			></Bin>
			<div tabindex="0" class="draggable-container delete-bin"></div>
		</div>
		<ShortcutsList
			class="shortcuts-list"
			tabindex="0"
			@add="shortcut_add($event)"
			@delete="delete_entry($event)"
			@edit="shortcut_edit($event, undefined, true)"
			@freeze="change('freeze', $event)"
			v-bind="{freeze, commands, contexts, keymap, shortcuts_list_active, normalize, capitalize, active_context, validate_entry}"
			:options="user_options"
			:nice_scrollbars="dev_options.nice_scrollbars"
		></ShortcutsList>
		<!-- <ShortcutsList
			class="bin-list"
			tabindex="0"
			@add="bin_shortcut_add($event)"
			@delete="bin_delete_entry($event)"
			@edit="bin_shortcut_edit($event, undefined, true)"
			@freeze="change('freeze', $event)"
			v-bind="{freeze, commands, contexts, keymap, shortcuts_list_active, normalize, capitalize, active_context, validate_entry}"
			:options="user_options"
			:nice_scrollbars="dev_options.nice_scrollbars"
		></ShortcutsList> -->
	</div>
</template>

<script>
import ContextsBar from "./components/contexts"
import Options from "./components/options"
import Keys from "./components/keys"
import Status from "./components/status"
import Bin from "./components/bin"
import ShortcutsList from "./components/shortcut_list"

import dragula from "dragula"
import { init, helpers, shortcut_editing, input_handlers, drag_handlers, errors } from "./mixins/index.js"
import { defaults } from "./defaults.js"

export default {
	name: "Shortcut-Visualizer",
	props: {
		// required, used directly
		layout: { type: Array, required: true },
		// required, cloned
		keys_list: { type: Object, required: true },
		// not required, used directly
		commands: { type: Array, required: false, default () {return []} },
		// not required, cloned
		shortcuts_list: { type: Array, required: false, default () {return []} },
		// there is no default order as we don't know what they're actually being called
		// will be used to fill modifiers_order in created using modifiers_names if nothing is passed
		order_of_modifiers: { type: Array, required: false },
		// see *_options computed properties below for defaults
		options_user: { type: Object, required: false },
		options_dev: { type: Object, required: false },
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
		// most of the logic of the component lives in one of the following mixins
		init,
		helpers,
		shortcut_editing,
		input_handlers,
		drag_handlers,
		errors
	],
	data() {
		return {
			// will be set by props (handled in created)
			keys: {},
			keymap: {},
			modifiers_names: [],
			modifiers_order: [], // order of modifiers
			shortcuts: [], // shortcuts_list,
			contexts_info: {}, // contains count for contexts, used in computed contexts property
			active_context: "", // for context-bar, set by options
			// also will be set by props if overriden, else these are the defaults
			// private to component
			modes: ["As Pressed", "Toggle Modifiers", "Toggle All"],
			chain: {
				// allow: true,
				in_chain: false,
				start: [],
				last: [],
				warning: false,
			},
			// bin shortcuts get added a holder property to link chains and not have conflicting shortcut groups
			// e.g. you have a set of chained shortcuts on Ctrl+B in the bin and add another set chained to the same
			// it would cause chaos, but we still want to keep the shortcuts used
			// also allows us to sort them by last added
			bin_holder_index: 0,
			mods_unknown: true,
			freeze: false,
			error: ""
		}
	},
	watch: {
		// handles the chain state
		keymap_active (newactive) {
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
		blocked_singles () {
			return this.get_blocked_singles(this.get_active_modifiers())
		},
		shortcuts_active () {
			return this.get_shortcuts_active(false)
		},
		shortcuts_list_active () {
			return this.get_shortcuts_active(true)
		},
		bin () {
			return this.shortcuts.filter(entry => entry.binned).sort((a, b) => {
				return a.holder > b.holder
			})
		},
		contexts () {
			return Object.keys(this.contexts_info).sort()
				.map(entry => (entry = entry.toLowerCase()))
				.sort()
		},
		// mix in options with defaults
		user_options () {
			return {
				...defaults.user_options,
				...this.options_user
			}
		},
		dev_options () {
			return {
				...defaults.dev_options,
				...this.options_dev
			}
		}
	},
	methods: {
		// set property by key (used to set freeze and options)
		change (key, data) {
			this[key] = data
		},
		change_options ({ key, value }) {
			this[key] = value
		},
		// display error messages to user
		set_error(error) {
			this.error = error
			this.$emit(error.type || "error", error)
			setTimeout(() => {
				this.error = false
			}, this.dev_options.timeout_error)
		},
	},
	created() {
		this.init({ all: true })
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
	&, & > div:not(.keyboard), input, .bins > div {
		outline: none;
	}
	input, button {
		color:inherit;
		background: inherit;
	}
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

	padding: $padding-size;
	display: flex;
	flex-direction: column;
	& > div {
		flex: 0 0 auto;
	}

	.bins {
		display: flex;
		margin: $padding-size;
		justify-content: space-between;
		.temp-bin {
			flex: 0 1 70%;
		}
		.delete-bin {
			flex: 0 1 30%;
			margin-left: $padding-size;
			align-self: stretch;
			background: transparentize($delete-color, 0.7);
			border: transparentize($delete-color, 0.7) $borders/2.5 solid;
			display: flex;
			justify-content: center;
			align-items: center;
			&.hovering::after {
				content: "DELETE";
				color: $delete-color;
				font-size: 2em;
			}
			.gu-transit {
				display: none;
			}
		}
	}
}
</style>
