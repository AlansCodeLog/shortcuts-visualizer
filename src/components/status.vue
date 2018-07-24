<template>
	<div class="status">
		<div
			tabindex="0"
			class="info"
			v-if="keymap_active.length > 0"
		>Pressed: {{normalize(keymap_active).join("+")}}</div>
		<div
			tabindex="0"
			class="info"
			v-if="chain.in_chain"
		>Waiting on chain: {{normalize(chain.start).join("+")}}</div>
		<div
			tabindex="0"
			class="warning"
			v-if="chain.warning"
		>No chained shortcut {{normalize(chain.last).join("+")}} {{normalize(chain.warning).join("+")}}</div>
		<div
			tabindex="0"
			class="warning"
			v-if="blocked_singles"
		>Shortcuts containing only {{normalize(blocked_singles).join("")}} as a modifier are blocked.</div>
		<div
			tabindex="0"
			:class="[error.type]"
			v-if="error"
		>{{error.message}}</div>
	</div>
</template>

<script>
export default {
	name: "Status",
	props: ["keymap_active", "chain", "blocked_singles", "error", "normalize"]
}
</script>

<style lang="scss">
.shortcut-visualizer {
	@import "../settings/theme.scss";
	.status {
		margin: $padding-size;
		text-align: center;
		& > div {
			padding: $padding-size/2 0;
		}
		.error {
			color: $status_error;
		}
		.warning {
			color: $status_warning
		}
	}
}

</style>