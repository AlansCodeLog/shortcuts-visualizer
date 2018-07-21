<template>
	<!-- tab index needs to be added so we can capture keyboard events, also allows us to ignore typing in other components -->
	<div
		:class="['keyboard', blocked_singles ? 'blocked_single' : '']"
		@keydown="$emit('keydown', $event)"
	>
		<!-- make our key rows from our layout -->
		<div
			:class="['key-row', row.length == 0 ? 'empty-row': '']"
			v-for="(row, rindex) of layout"
			:key="rindex"
			:id="'key-row' + rindex"
		>
			<!-- create the key with classes for showing whether we're pressing it and/or if we're in a chain, show the chain's pressed keys -->
			<div
				v-for="(key, index) of row"
				v-if="keys[key]"
				:key="index"
				:id="[keys[key].ignore ? '': key]"
				:class="[keys[key].classes, extra_classes(key)]"
			>
				<!-- the label for the key character, also contains any label classes -->
				<div
					v-if="
						keys[key]
						&& !keys[key].ignore
						"
					:class="['label', keys[key].label_classes]"
				>{{keys[key].character}}</div>
				<!-- the key container, used to style most of the key, is also dragging container for dragula and ignored keys can't get dragged -->
				<div
					:class="['key-container', keys[key].ignore ? '' : 'draggable-container']"
				>
					<!-- the actual shortcut entry command, this is what gets dragged if we drag -->
					<div
						:class="['draggable', 'key-entry', active_keys[keys[key].identifier].entry.chain_start ? 'is_chain' : '']"
						v-if="
							!keys[key].ignore
							&& !keys[key].is_modifier
							&& active_keys[keys[key].identifier] !== undefined
						"
						:shortcuts_index="active_keys[keys[key].identifier].entry.index"
					>
						<div class="command">{{active_keys[keys[key].identifier].entry.command}}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import dragula from "dragula"

export default {
	name: "Keys",
	// any props that look like they weren't used are being used by the helpers!
	props: ["chain", "keymap", "keys", "layout", "shortcuts_active", "blocked_singles"],
	computed: {
		active_keys () {
			let active_keys = {}
			// assign each active shortcut to an object by key (excluding modifiers)
			// also add index property for use within this component to quickly get entry
			this.shortcuts_active.map(entry => {
				// if we're in a chain check against the end else check agains the beginning
				let shorcut_index = this.chain.in_chain && entry.chained ? 1 : 0
				let intersect = entry._shortcut[shorcut_index].filter(identifier => !this.keymap[identifier].is_modifier)
				active_keys[(intersect.join(""))] = { entry }
			})
			return active_keys
		},
	},
	methods: {
		extra_classes(key) {
			let info = this.keys[key]
			if (info !== undefined) {
				let classes = []
				if (info.active) {classes.push("pressed")}
				if (info.chain_active) {classes.push("chain-pressed")}
				if (this.blocked_singles && this.blocked_singles.indexOf(info.identifier) !== -1) {
					classes.push("blocked_single_key")
				}
				return classes.join(" ")
			} else {
				return ""
			}
		}
	}
}
</script>

<style lang="scss">
//do not scope! causes problems, also we want to be able to target light/dark theme from within component

.shortcut-visualizer {
// 	@import "../settings/theme.scss";
	@import "../settings/keyboard_base.scss"; //handles the messy stuff so we can concentrate on styling
	&.background-light {
		.key:not(.blank) > .key-container {
			background: $cap-light;
			border-color: mix($cap-light, black, 90%);
			box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-light, black, 50%);
		}
		.blank .key-container {
			border: none;
		}
	}
	&.background-dark {
		.key:not(.blank) > .key-container {
			background: $cap-dark;
			border-color: mix($cap-dark, black, 90%);
			box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-dark, black, 50%);
		}
		.blank .key-container {
			border: none;
		}
	}

	.keyboard {
		margin: $padding-size;
		.label {
			$spacing: $keyboard-font-size * 1.3 / 2;
			top: $spacing;
			padding: $spacing/2;
			padding-top: $spacing/3;
		}
		.key-entry, .gu-transit {
			cursor: pointer;
			position: absolute;
			top: $keyboard-font-size * 1.3;
			bottom: 0;
			left: 0;
			right:0;
			font-size: $shortcut-font-size;
			text-align: center;
			display:flex;
			align-items: center;
			background: hsla(hue($accent-color), 100%, 50%, 0.2);
			border: rgba(0,0,0,0)  $padding-size/7.5 solid;
			.command {
				text-align: center;
				user-select: none;
				word-break: break-word;
				max-height: 100%;
				overflow: hidden;
				padding: $padding-size/7.5;
				margin: 0 auto;
			}
		}
		.gu-transit {
			border-color: $accent-color;
		}
		.gu-transit {
			display: none;
			&.key-entry, &.command-entry, &.bin-entry {
				display: block;
				.tooltip, .delete {
					display: none;
				}
			}
		}
		.key:not(.blank) { //we need to match specificity or we can't change the border color
			&.pressed > .key-container {
				border-color: $accent-color;
			}
			&.is_chain > .key-container {
				border-color: transparentize($accent-color, 0.7);
			}
			&.chain-pressed > .key-container::before {
				content: "";
				position: absolute;
				top:-$cap-spacing;
				bottom:-$cap-spacing;
				left:-$cap-spacing;
				right:-$cap-spacing;
				border-color: mix($accent-color,rgba(0,0,0,0), 50%);
				border-style: dotted;
			}
			&.blocked_single_key > .key-container {
				border-color: transparentize($blocked_single_color, 0.3) !important;
			}
		}
		&.blocked_single .key:not(.blank) > .key-container {
			background: transparentize($blocked_single_color, 0.8);
		}
		// things dragged to here
		.gu-mirror {
			display:none;
		}
		.will_be_replaced {
			z-index: 1;
		}
	}
}
</style>

