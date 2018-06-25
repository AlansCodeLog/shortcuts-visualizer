<template>
	<div class="temp-bin bin-container">
		<div class="draggable-container bin">
			<div
				:class="['draggable', 'bin-entry', entry.chain_start ? 'is_chain':'']"
				v-for="(entry, index) in bin"
				:key="index+entry.command"
			><span :shortcuts_index="bin[index].index" class="command" :title="`Shortcut: ${entry.shortcut}${entry.chain_start ? ' (Chain Start)' :''}\nContexts: [${entry.contexts.join(', ')}]`">{{entry.command}}</span><div
				class="delete"
				@click="$emit('delete', bin[index])"
			>&#10006;</div>
			<div class="tooltip">
				<div><strong>Shortcut&nbsp;&nbsp;</strong>{{entry.shortcut}}{{entry.chain_start ? ' (Chain Start)' :''}}</div>
				<div><strong>Contexts&nbsp;&nbsp;</strong>[{{entry.contexts.join(', ')}}]</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import dragula from "dragula"

export default {
	name: "Bin",
	props: ["bin"],
}
</script>

<style lang="scss">

.shortcut-visualizer {
	@import "../settings/theme.scss";
	&.background-light {
		.bin-container {
			background: rgba(0,0,0,0.1);
			border-color: rgba(0,0,0,0.1);
		}
		.tooltip {
			background: mix(white, $accent-color, 50%);
		}
	}
	&.background-dark {
		.bin-container {
			background: rgba(0,0,0,0.25);
			border-color:rgba(0,0,0,0.3);
		}
		.tooltip {
			background: mix(black, $accent-color, 50%);
		}
	}
	.bin-container {
		min-height: $padding-size*5;
		border: $borders/2 solid rgba(0,0,0,0);
		display: flex;
	}
	.bin {
		flex: auto;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		padding: $small-pad-size;
		align-items: start;
		.bin-entry, .gu-transit {
			user-select: none;
			cursor: pointer;
			flex: 0 0 auto;
			padding: $small-pad-size;
			margin: $small-pad-size/2;
			position: relative;
			background: rgba(0,0,0,0.3);
			border: rgba(0,0,0,0) $borders/2 solid;
			.delete {
				display: none;
				position: absolute;
				top: calc(#{-$small-pad-size} - 0.6em);
				right: calc(#{-$small-pad-size} - 0.6em);
				width: 1.2em;
				height: 1.2em;
				border: $borders/2 solid mix(red, black, 80%);
				background: transparentize(red, 0.7);
				color: red;
				line-height: 1.2em;
				border-radius: 100%;
				text-align: center;
				cursor: pointer;
				z-index: 1;
			}
			.tooltip {
				padding: $small-pad-size;
				display: none;
				position: absolute;
				bottom: 100%;
				left: 50%;
				transform: translate(-50%, -20%);
				width: auto;
				white-space: nowrap;
				border: $borders/2 solid $accent-color;
				div {
					padding: $small-pad-size;
				}
				z-index: 2;
			}
			&:hover .tooltip {
				display: block;
			}
			.tooltip::before {
				border: solid;
				border-color: $accent-color transparent;
				border-width: $borders*2 $borders*2 0  $borders*2;
				bottom: - $borders*2;
				left: 50%;
				transform: translateX(-50%);
				content:"";
				position: absolute;
			}
			&:hover:not(.gu-mirror) .delete {
				display: block;
			}
		}
		.is_chain  {
			border: $borders/2 solid rgba(0,0,0,1);
		}
		.gu-transit {
			border: $borders/2 solid $accent-color;
		}
		.gu-transit.is_chain {
			border: $borders/2 solid red;
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
	.bin-entry.gu-mirror {
		&:hover {
			.tooltip, .delete {
				display: none;
			}
		}
		.tooltip, .delete {
			display: none;
		}
	}
}
</style>

