<template>
		<div
			class="entry editing"
			:shortcuts_index="shortcuts_list_active[index].index"
		>
		<!-- COLUMN EDIT -->
		<div :class="['edit']">
			<!-- Cancel -->
			<span
				class="button dont_blur"
				@click="$emit('cancel')"
			>&#10006;</span>
			<!-- Enter -->
			<span
				class="button dont_blur"
				@click="$emit('edit', edit)"
			>&#10004;</span>
		</div>

		<!-- COLUMN CHAIN -->
		<div class="chain" title="Chain Start">
			<input
				type="checkbox"
				v-model="edit.chain_start"
				@keydown.enter="$emit('edit', edit)"
				@blur="$emit('blur', edit)"
				@keydown.esc="$emit('cancel')"
			/>
		</div>

		<!-- note: don't leave spaces between {{variables}} in shortcut, command, and contexts columns -->

		<!-- COLUMN SHORTCUT -->
		<div :class="['draggable-container', 'shortcut']">
			<input
				class="dont_blur"
				v-model="edit.shortcut"
				@keydown.enter="$emit('edit', edit)"
				@blur="$emit('blur', edit)"
				@keydown.esc="$emit('cancel')"
			/>
		</div>

		<!-- COLUMN COMMAND -->
		<div :class="['draggable-container', 'command']">
			<list_input
				class="dont_blur"
				v-model="edit.command"
				:list="commands"
				:allow_chain="false"
				@enter="$emit('edit', edit)"
				@blur="$emit('blur', edit)"
				@esc="$emit('cancel')"
			>
			</list_input>
		</div>

		<!-- COLUMN CONTEXTS -->
		<div class="draggable-container contexts">
			<list_input
				class="dont_blur"
				v-model="edit.contexts"
				:list="contexts"
				:allow_chain="true"
				@enter="$emit('edit', edit)"
				@blur="$emit('blur', edit)"
				@esc="$emit('cancel')"
			>
			</list_input>
		</div>
		<div class="delete" title="delete" @click="$emit('delete')">&#10006;</div>
	</div>
</template>

<script>
import list_input from "./list_input"

export default {
	name: "Editing-Entry",
	props: ["entry", "editing_index", "shortcuts_list_active", "contexts", "commands", "index"],
	components: {
		list_input
	},
	data () {
		return {
			edit: {
				shortcut: "",
				command: "",
				contexts: this.active_context,
				chain_start: false
			}
		}
	},
	methods: {
	},
	created() {
		let entry = this.shortcuts_list_active[this.editing_index]
		this.edit.shortcut = entry.shortcut
		this.edit.command = entry.command
		this.edit.contexts = entry.contexts.join(", ").toLowerCase()
		this.edit.chain_start = entry.chain_start
	}
}
</script>
<style lang="scss" scoped>
.shortcut-visualizer {
	@import "../../settings/theme.scss";
	// most of this element is styled in conjunction with similar components
	// in shortcut_list
}
</style>