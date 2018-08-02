<template>
	<div class="adding">
		<!-- add is drag container so we can drag to it -->
		<div v-if="!adding" class="add drag-container" @click="$emit('adding')">
			<div><!--gets filled by css below so it can say something else when it's being dragged to--></div>
		</div>
		<div
			class="entry-to-add"
			v-if="adding"
		>
			<div class="basic">
				<div
					class="edit"
					@click="add()"
				>
					<span>&#10004;</span>
				</div>
				<div class="chain" title="Chain Start">
					<input
						type="checkbox"
						@keydown.enter="add()"
						@keydown.esc="$emit('cancel')"
						v-model="entry.chain_start"
					/>
				</div>
				<div class="shortcut">
					<list_input
						class="shortcut"
						v-model="entry.shortcut"
						:allow_chain="false"
						@enter="add()"
						@esc="$emit('cancel')"
					>
					</list_input>
				</div>
				<div class="command">
					<list_input
						class="command"
						v-model="entry.command"
						:list="commands"
						:allow_chain="false"
						@enter="add()"
						@esc="$emit('cancel')"
					>
					</list_input>
				</div>
				<div class="contexts" >
					<list_input
						class="contexts"
						v-model="entry.contexts"
						:list="contexts"
						:allow_chain="true"
						@enter="add()"
						@esc="$emit('cancel')"
					>
					</list_input>
				</div>
				<div
					class="delete"
					title="cancel"
					@click="$emit('cancel')"
				>&#10006;</div>
			</div>
			<div class="options">
				<div>Some Option</div><div>Some Other Options</div>
			</div>
		</div>
	</div>
</template>

<script>
import list_input from "../input/list_input"

export default {
	name: "Add-Entry",
	props: ["adding", "commands", "contexts", "active_context", "validate_entry"],
	components: {
		list_input
	},
	data () {
		return {
			entry: {
				shortcut: "",
				command: "",
				contexts: this.active_context,
				chain_start: false
			}
		}
	},
	methods: {
		add() {
			let result = this.validate_entry({ ...this.entry })
			if (!result) {return}

			this.$emit("add", result.entry)
			if (result.to_add) {
				this.$emit("add", result.to_add)
			}
			// reset
			this.entry.shortcut = ""
			this.entry.command = ""
			this.entry.contexts = this.active_context
			this.entry.chain_start = false
			this.$emit("cancel")
		},
	},
}
</script>
<style lang="scss" scoped>
.shortcut-visualizer {
	@import "../../settings/theme.scss";
	// most of this element is styled in conjunction with similar components
	// in shortcut_list
	.entry-to-add {
		background: transparentize($accent-color, 0.7);
		.edit {
			justify-content: center;
		}
	}
	.add, .stop-add, {
		border-bottom: $borders/5 solid rgba(0, 0, 0, 0.5);
		width: 100%;
		font-weight: bold;
		text-align: center;
		display: inline-block;
		cursor: pointer;
		font-size: 1.2em;
		& > div {
			padding: $small-pad-size;
			margin: 0 auto;
			border: $borders/2.5 solid transparent;
		}
	}
	.add {
		& > div::before {
			content: "Add a Shortcut +";
		}
		&.will_be_added {
			border: $borders/2.5 solid transparentize($accent-color, 0.2) !important;
			& > div {
				border: $borders/5 solid transparent;
				&::before {
					content: "Move to List";
				}
			}
		}
		.gu-transit {
			display: none;
		}
		&:not(.will_be_added) {
			color: $accent-color;
		}
	}
	.stop-add {
		color: $dragging-not-allowed-background;
	}
	.options {
		margin: 0;
		padding: $small-pad-size * 2;
		flex: 1 0 100%;
	}
}
</style>