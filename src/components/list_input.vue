<template>
	<div class="list-input" tabindex="0">
		<input
			:value="value"
			@input="focus();$emit('input', $event.target.value)"
			@click="focus()"
			@keydown.enter="$emit('enter', $event)"
			@keydown.esc="$emit('esc', $event)"
			@blur="blur($event)"
		/>
		<div class="list" v-if="in_focus">
			<div
				v-for="(entry, index) of possible_entries"
				:key="entry+index"
				@click="handle_input(entry)"
			>
			{{entry}}
			</div>
		</div>
	</div>
</template>

<script>

export default {
	name: "List-Input",
	props: ["value", "list", "allow_chain"],
	data () {
		return {
			in_focus: false
		}
	},
	computed: {
		possible_entries () {
			let value_low = this.value.toLowerCase().trim()
			let first_value_low = value_low
			let first_comma
			if (this.allow_chain) {
				first_comma = value_low.indexOf(",")
				first_comma = first_comma !== -1 ? first_comma + 1 : 0
				value_low = value_low.slice(first_comma, value_low.length).trim()
			}
			if (this.list) {
				return this.list.filter(entry => {
					let entry_low = entry.toLowerCase()
					return entry_low.indexOf(value_low) !== -1
					&& first_value_low.slice(0, first_comma ? first_comma : first_value_low.length).indexOf(entry_low) == -1
				})
			} else {
				return []
			}
		}
	},
	methods: {
		blur (event) {
			this.in_focus = false
			this.$emit("blur", event)
		},
		focus() {
			this.in_focus = true
			// this.$emit("unfocus_others")
		},
		handle_input (value) {
			if (this.allow_chain) {
				if (this.value.indexOf(value) == -1) {
					let new_value = value
					let temp_value = this.value.toLowerCase()
					let first_comma = temp_value.indexOf(",")
					let no_comma = first_comma !== -1 ? false : true
					first_comma = first_comma !== -1 ? first_comma + 1 : 0
					temp_value = temp_value.slice(first_comma, temp_value.length).trim()
					let temp_index = value.toLowerCase().indexOf(temp_value)
					let current = this.value
					if (temp_index !== -1) {
						current = this.value.slice(0, no_comma ? first_comma : first_comma - 1)
					}
					value = no_comma ? new_value : current + ", " + new_value
				} else {
					value = this.value
				}
			}
			this.$emit("input", value)
		}
	}
}
</script>
<style lang="scss" scoped>
.shortcut-visualizer {
	@import "../settings/theme.scss";

	&.background-light {
		background: $theme-light-background;
		color: invert($theme-light-background);
		.list div {
			background: $theme-light-background;
		}
	}
	&.background-dark {
		background: $theme-dark-background;
		color: invert($theme-dark-background);
		.list div {
			background: $theme-dark-background;
		}
	}

	.list {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		div {
			padding: $small-pad-size;
			position: relative;
			&::before {
				content: "";
				position: absolute;
				top: 0;
				bottom: 0;
				right: 0;
				left: 0;
				background: rgba(255, 166, 0, 0.1);
			}
			&:hover::before {
				background: rgba(255, 166, 0, 0.3);
				color: #a3480c;
			}
		}
	}
}
</style>