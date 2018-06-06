<template>
	<div class="temp-bin bin-container">
		<div class="draggable-container bin">
			<div
				:class="['draggable', 'bin-entry', entry.chain_start ? 'is_chain':'']"
				v-for="(entry, index) in bin"
				:key="index+entry.command"
			><span :index="index" class="command">{{entry.command}}</span><div
				class="remove"
				@click="remove(index)"
			>&#10006;</div></div>
		</div>
	</div>
</template>

<script>
import dragula from "dragula"
import {keys_from_text, normalize, multisplice} from "../helpers/helpers"
export default {
	name: "Bin",
	props: ["bin", "chain", "context", "keymap", "keymap_active", "modifiers_names", "modifiers_order", "options", "shortcuts", "shortcuts_active", "shortcuts_list_active"],
}
</script>

<style lang="scss">

.shortcut-visualizer {
	&.background-light {
		.bin-container {
			background: rgba(0,0,0,0.1);
			border-color: rgba(0,0,0,0.1);
		}
	}
	&.background-dark {
		.bin-container {
			background: rgba(0,0,0,0.25);
			border-color:rgba(0,0,0,0.3);
		}
	}
	@import "../settings/theme.scss";
	.bin-container {
		min-height: 4.5em;
		border: 2px solid rgba(0,0,0,0);
		display: flex;
	}
	.bin {
		flex: auto;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0.5em;
		// .bin-entry .gu-transit {
		// 	display: none !important;
		// }
		.bin-entry, .gu-transit {
			user-select: none;
			cursor: pointer;
			flex: 0 0 auto;
			padding:0.5em;
			margin: 0.5em;
			position: relative;
			background: rgba(0,0,0,0.3);
			border: rgba(0,0,0,0) 0.2em solid;
			.remove {
				display: none;
				position: absolute;
				top: -0.7em;
				right: -0.7em;
				width: 1.2em;
				height: 1.2em;
				border: 2px solid mix(red, black, 80%);
				background: transparentize(red, 0.7);
				color: red;
				line-height: 1.2em;
				border-radius: 100%;
				text-align: center;
				cursor: pointer;
			}
			&:hover:not(.gu-mirror) .remove {
				display: block;
			}
		}
		.is_chain  {
			border: 2px solid rgba(0,0,0,1);
		}
		.gu-transit {
			border: 2px solid $accent-color;
		}
		.gu-transit.is_chain {
			border: 2px solid red;
			display: flex;
			align-items: center;
			flex-wrap: nowrap;
			& div {
				flex: 0 0 auto;
			}
			&::after {
				content: "+";
				flex: 0 0 auto;
				padding-left: 0.2em;
				font-weight: bold;
				color: $dragging-will-be-replaced;
				font-size: 2em;
				line-height: 0.5em;
				max-height: 0.5em;
			}
		}
	}
}
</style>

