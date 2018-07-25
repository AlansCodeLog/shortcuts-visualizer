<template>
	<div
		:class="['entry', entry.editing ? 'editing' : '', entry.changed ? 'changed' : '', entry.dragging ? 'dragging' : '']"
		:shortcuts_index="shortcuts_list_active[index].index"
	>
		<!-- COLUMN EDIT -->
		<div :class="['edit']">
			<!-- Edit -->
			<span
				class="button"
				@click="$emit('edit')"
			>&#10000;</span>
		</div>

		<!-- COLUMN CHAIN -->
		<!-- NOT EDITING -->
		<div v-if="entry.chain_start" class="chain is_chain" title="Chain Start">&#128279;</div>
		<div v-if="!entry.chain_start" class="chain not_chain"></div>

		<!-- note: don't leave spaces between {{variables}} in shortcut, command, and contexts columns -->

		<!-- COLUMN SHORTCUT -->
		<div :class="['draggable-container', 'shortcut']">
			<!-- NOT EDITING -->
			<div
				class="draggable list-entry shortcut-entry"
				@click="$emit('edit')"
			>{{entry._shortcut.map(keyset => normalize(keyset).join("+")).join(" ")}}</div>
		</div>

		<!-- COLUMN COMMAND -->
		<div :class="['draggable-container', 'command']">
			<!-- NOT EDITING -->
			<!-- is_chain is needed for styling when dragging to bin //todo remove-->
			<div
				:class="['draggable', 'list-entry', 'command-entry', entry.chain_start ? 'is_chain' : '']"
				@click="$emit('edit', 'command')"
			>{{entry.command}}</div>
		</div>

		<!-- COLUMN CONTEXTS -->
		<div class="draggable-container contexts">
			<!-- NOT EDITING -->
			<div
				class="draggable list-entry context-entry"
				@click="$emit('edit', 'contexts')"
				v-for="context of entry.contexts"
				:key="context"
			>{{capitalize(context)}}</div>
		</div>
		<div class="delete" title="delete" @click="$emit('delete')">&#10006;</div>
	</div>
</template>

<script>
import list_input from "./list_input"

export default {
	name: "Editing-Entry",
	props: ["entry", "shortcuts_list_active", "index", "normalize", "capitalize"],
	components: {
		list_input
	},
	data () {
		return {
		}
	},
	methods: {
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