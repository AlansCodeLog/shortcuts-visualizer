<template>
	<div class="contexts-bar draggable-container" title="Contexts"  v-if="contexts.length > 1">
		<div
			tabindex="0"
			v-for="context in contexts"
			:key="context"
			:class="['draggable', 'contexts-bar-entry', context == active ? 'active' : '']"
			@click="$emit('change', context)"
		>{{context}}</div>
	</div>
</template>

<script>
export default {
	name: "Contexts-Bar",
	props: ["contexts", "active"],
	components: {},
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
		&.context-bar-entry {
			text-transform: capitalize
		}
	}
	.contexts-bar {
		text-transform: capitalize;
		margin: $padding-size;
		padding: $padding-size/2;
		font-weight:bold;
		flex: 1 1 auto;
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		border: 2px solid rgba(0,0,0,0);
		.contexts-bar-entry {
			flex: 0 0 auto;
			padding: 0 $padding-size;
			display: block;
			cursor: pointer;
		}
		.active {
			color: mix(white, hsla(hue($accent-color), 100%, 50%, 1), 20%);
		}
	}
}
</style>