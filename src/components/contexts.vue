<template>
	<div class="contexts-bar" title="contexts">
		<div
			class="draggable-container contexts-bar-container"
			tabindex="0"
			v-for="context in contexts"
			:key="context"
		>
			<div
				:class="['draggable', 'contexts-bar-entry', context == active ? 'active' : '']"
				@click="$emit('change', context)"
			>{{capitalize(context)}}</div>
		</div>
		
	</div>
</template>

<script>
export default {
	name: "Contexts-Bar",
	props: ["contexts", "active", "capitalize"],
}
</script>
<style lang="scss">
.shortcut-visualizer {
	@import "../settings/theme.scss";
	&.background-light {
		.contexts-bar {
			background: rgba(0,0,0,0.1);
			border-color: rgba(0,0,0,0.1);
		}
	}
	&.background-dark {
		.contexts-bar {
			background: rgba(0,0,0,0.25);
			border-color:rgba(0,0,0,0.3);
		}
	}
	//when dragged to other places
	.gu-mirror {
		&.contexts-bar-entry {
			// text-transform: capitalize
		}
	}
	.contexts-bar {
		// text-transform: capitalize;
		margin: $padding-size;
		padding: $padding-size/4;
		font-weight:bold;
		flex: 1 1 auto;
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		border: $borders/2 solid rgba(0,0,0,0);
		.contexts-bar-entry {	
			padding: $padding-size /4 $padding-size;
			border-radius: $borders;
		}
		.contexts-bar-container {
			flex: 0 0 auto;
			padding: 0 $padding-size/6;
			display: block;
			cursor: pointer;
			.gu-mirror {
				display: none;
			}
			&.unselectable {
				color: auto;
				background: auto;
			}
		}
		.active {
			color: mix(white, hsla(hue($accent-color), 100%, 50%, 1), 20%);
		}
		.unselectable.contexts-bar-entry {
			color: $dragging-not-allowed-background !important;
			background: transparentize($dragging-not-allowed-background, 0.7) !important;
			border-color: mix($dragging-not-allowed, $dragging-not-allowed-background) !important;
		}
		.gu-transit {
			display: none;
		}
	}
}
</style>