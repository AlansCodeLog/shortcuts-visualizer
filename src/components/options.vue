<template>
	<div class="options" >
		<div class="row">
			<div class="option">
				<input id="button-theme" type="checkbox" v-model="theme_dark" @change="$emit('change', ['theme_dark', theme_dark])"/>
				<label for="button-theme">Dark Theme</label>
			</div>
			<div class="option">
				<label for="mode-select">Mode</label>
				<select id="mode-select" v-model="mode" @input="$emit('change', ['mode', mode])">
					<option v-for="keymode in modes" :key="keymode">{{keymode}}</option>
				</select>
			</div>
			<div class="option">
				<input id="accept-on-blur" type="checkbox" v-model="accept_on_blur" @change="$emit('change', ['accept_on_blur', accept_on_blur])"/>
				<label for="accept-on-blur">Accept Edits on Click Away</label>
			</div>
			<div class="option">
				<input id="never-blur" type="checkbox" v-model="never_blur" @change="$emit('change', ['never_blur', never_blur])"/>
				<label for="never-blur">Do Nothing on Click Away</label>
			</div>
			<div class="option">
				<input id="auto-delete-contexts" type="checkbox" v-model="delete_empty_contexts" @change="$emit('change', ['delete_empty_contexts', delete_empty_contexts])"/>
				<label for="auto-delete-contexts">Automatically Remove Empty Contexts</label>
			</div>
			<div class="option">
				<input id="allow-tab-out" type="checkbox" v-model="allow_tab_out" @change="$emit('change', ['allow_tab_out', allow_tab_out])"/>
				<label for="allow-tab-out">Allow Tabbing out of Keyboard</label>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "Options",
	props: ["modes", "options"],
	data () {
		return {
			theme_dark: this.options.theme_dark,
			mode: this.options.mode,
			accept_on_blur: this.options.accept_on_blur,
			never_blur: this.options.never_blur,
			allow_tab_out: this.options.allow_tab_out,
			delete_empty_contexts: this.options.delete_empty_contexts
		}
	},
}
</script>
<style lang="scss">

.shortcut-visualizer {
	@import "../settings/theme.scss";
	//TODO fix checkbox

	.options {
		margin: $padding-size;
		.row {
			width:100%;
			padding: $padding-size/4 0;
			display: flex;
			flex-wrap:wrap;
			justify-content: space-around;
			align-items: center;
			font-size: $regular-font-size;
			@media (max-width: $regular-media-query){
				font-size: $regular-shrink-amount * $regular-font-size;
			}
			//wonderful little trick to undo margin in right/left options, including wrapped flexboxes
			margin-left: -$small-pad-size; //do not set right
			margin-top: -$small-pad-size;
			margin-bottom: -$small-pad-size;
			width: calc(100% + #{$small-pad-size*2});
			.option {
				margin: $small-pad-size;
				display: flex;
				align-items:center;
				input[type="checkbox"] {
					flex: 0 0 auto;
					height: 1em;
					width: 1em;
					font-size: 1em;
					padding: 0;
					background: none;
					border: none;
					margin-right: 0.7em;
				}
			}
			select {
				font-size: 1em;
				margin-left: $small-pad-size;
				border: none;
				padding: $small-pad-size/2;
			}
		}
	}
}
</style>
