<template>
	<div class="shortcuts">
	<div class="container">
		<div v-if="!adding" class="add" @click="toggle_adding()">Add a Shortcut +</div>
		<div v-else class="stop-add" @click="toggle_adding()">Cancel</div>
		<div class="entry-header">
		<div class="edit"></div>
		<div class="chain" title="Chain Start"></div>
		<div class="shortcut">Shortcut</div>
		<div class="command">Command</div>
		<div class="contexts">Contexts</div>
		<div class="delete" title="delete"></div>
		</div>
		<div v-if="adding" class="adding">
		<div class="edit" @click="add()">
			<span>&#10004;</span>
		</div>
		<div class="chain" title="Chain Start">
			<input
			type="checkbox"
			@keydown.enter="add()"
			@keydown.esc="toggle_adding()"
			v-model="entry_to_add.chain_start"
			/>
		</div>
		<div class="shortcut">
			<input
			class="shortcut"
			@keydown.enter="add()"
			@keydown.esc="toggle_adding()"
			v-model="entry_to_add.shortcut"
			/>
		</div>
		<div class="command">
			<input
			class="command"
			@keydown.enter="add()"
			@keydown.esc="toggle_adding()"
			v-model="entry_to_add.command"
			/>
		</div>
		<div class="contexts" >
			<input
			class="contexts"
			@keydown.enter="add()"
			@keydown.esc="toggle_adding()"
			v-model="entry_to_add.contexts"
			/>
		</div>
		<div class="delete" title="cancel" @click="toggle_adding()">&#10006;</div>
		</div>
		<div
		:class="['entry', entry.editing ? 'editing' : '', 'entry'+index, entry.changed ? 'changed' : '', entry.dragging ? 'dragging' : '']"
		v-for="(entry, index) of shortcuts_list_active" :key="entry.shortcut+entry.command"
		:index = index
		>  
		<!-- COLUMN EDIT -->
		<div :class="['edit']">
			<!-- Edit -->
			<span
			v-if="!entry.editing"
			class="button"
			@click="toggle_editing(true, entry, index)"
			>&#10000;</span>
			<!-- Cancel -->
			<span
			v-if="entry.editing"
			class="button dont_blur"
			@click="cancel_edit(entry)"
			>&#10006;</span>
			<!-- Enter -->
			<span
			v-if="entry.editing"
			class="button dont_blur"
			@click="toggle_editing(false, entry, index)"
			>&#10004;</span>
		</div>

		<!-- COLUMN CHAIN -->
		<div v-if="entry.chain_start" class="chain is_chain" title="Chain Start">&#128279;</div>
		<div v-else class="chain not_chain"></div>
		
		<!-- note: don't leave spaces between {{variables}} in shortcut, command, and contexts columns -->

		<!-- COLUMN SHORTCUT -->
		<div :class="['draggable-container', 'shortcut']">
			<!-- NOT EDITING -->
			<div
			class="draggable list-entry shortcut-entry"
			v-if="!entry.editing"
			@click="toggle_editing(true, entry, index)"
			>{{entry._shortcut.map(keyset => normalize(keyset).join("+")).join(" ")}}</div>
			<!-- EDITING -->
			<input
			class="dont_blur"
			v-if="entry.editing"
			v-model="editing.shortcut"
			@keydown.enter="toggle_editing(false, entry, index)"
			@blur="check_blur(entry, index)"
			@keydown.esc="cancel_edit(entry)"
			/>
		</div>

		<!-- COLUMN COMMAND -->
		<div :class="['draggable-container', 'command']">
			<!-- NOT EDITING -->
			<!-- is_chain is needed for styling when dragging to bin //todo remove-->
			<div
			:class="['draggable', 'list-entry', 'command-entry', entry.chain_start ? 'is_chain' : '']"
			@click="toggle_editing(true, entry, index, 'command')"
			v-if="!entry.editing"
			>{{entry.command}}</div>
			<!-- EDITING -->
			<list_input
			class="dont_blur"
			v-if="entry.editing"
			v-model="editing.command"
			:list="commands"
			:allow_chain="false"
			@enter="toggle_editing(false, entry, index)"
			@blur="check_blur(entry, index)"
			@esc="cancel_edit(entry)"               
			>
			</list_input>
		</div>

		<!-- COLUMN CONTEXTS -->
		<div :class="['draggable-container', 'contexts']">
			<!-- NOT EDITING -->
			<div
			class="draggable list-entry context-entry"
			@click="toggle_editing(true, entry, index, 'contexts')"
			v-if="!entry.editing"
			>{{entry.contexts.join(", ")}}</div>
			<!-- EDITING -->
			<list_input
			class="dont_blur"
			v-if="entry.editing"
			v-model="editing.contexts"
			:list="contexts"
			:allow_chain="true"
			@enter="toggle_editing(false, entry, index)"
			@blur="check_blur(entry, index)"
			@esc="cancel_edit(entry)"               
			>
			</list_input>
		</div>
		<div class="delete" title="delete" @click="remove(index)">&#10006;</div>
		</div>
	</div>
	</div>
</template>

<script>

import dragula from "dragula"
import list_input from "./list_input"

export default {
	name: "Shortcuts",
	props: ["commands", "contexts", "keymap", "options", "shortcuts_list_active", "normalize"],
	components: {
		list_input
	},
	data () {
		return {
			editing_index: undefined,
			editing: {
				shortcut: "",
				command: "",
				contexts: "",
			},
			adding: false,
			entry_to_add: {
				shortcut: "",
				command: "",
				contexts: "global",
				chain_start: false,
			}
		}
	},
	methods: {
		remove (index) {
			this.$emit("delete", this.shortcuts_list_active[index])
		},
		toggle_adding() {
			this.adding = !this.adding
			if (this.adding) {
				this.$emit("freeze", true)
				this.entry_to_add.shortcut = ""
				this.entry_to_add.command = ""
				this.entry_to_add.contexts = this.active_context
				this.entry_to_add.chain_start = false
			} else {
				this.$emit("freeze", false)
			}
		},
		add() { //everything is in this component so we can give the user a chance to edit the entry
			let entry = {...this.entry_to_add}
			if (entry.contexts == "") {
				entry.contexts = this.active_context
			}
			entry.contexts = entry.contexts.split(/\s*,\s*/g)
		
			//handle any errors
			if (entry.command == "") {
				this.$emit("error", {message: "Entry command cannot be empty."})
				return
			}
			try {
				var result = this.create_shortcut_entry(entry, true)
			} catch (error) {
				this.$emit("error", {message: error})
				return
			}
			entry = result.entry
			let {extra, remove, error, invalid} = result
		
			if (remove) {
				this.$emit("error", {message: "Shortcut " +entry.shortcut+" is a chain start. It cannot be overwritten."})
				return
			}
			if (error) {
				if (error.code == "Chain Error") {
					this.$emit("error", {message: "Shortcut " +entry.shortcut+" is a chain start. It cannot be overwritten."})
				} else {
					this.$emit("error", error)
				}
				return
			}
			if (invalid) {
				this.$emit("error", invalid)
				return
			}
			//if no errors, emit add
			this.$emit("add", entry)
			//reset
			this.entry_to_add.shortcut = ""
			this.entry_to_add.command = ""
			this.entry_to_add.contexts = this.active_context
			this.entry_to_add.chain_start = false
			this.toggle_adding()
		},
		toggle_editing (editing, entry, index, focusto = "shortcut", check_existing = true) {
			
			if (!editing && !Array.isArray(this.editing.contexts)) {
				this.editing.contexts = this.editing.contexts.toLowerCase().split(/\s*,\s*/g)
			}

			//we need to keep a reference to the original values in case we accept_on_blur
			let shortcut = this.editing.shortcut
			let command = this.editing.command
			let contexts = this.editing.contexts
			
			//the first time, we want to check if we were editing something (that is we were editing a shortcut then clicked to another) and cancel/accept depending on whether to accept on blur
			//but we don't want to check again when this function calls itself here
			if (check_existing) {
				let existing = this.shortcuts_list_active.findIndex((existing_entry, existing_index) => existing_entry.editing && existing_index !== index)
			
				if (existing !== -1) {
					let existing_entry = this.shortcuts_list_active[existing]
					if (this.options.accept_on_blur) {
						this.toggle_editing(false, existing_entry, index, undefined, false)
					} else {
						this.cancel_edit(existing_entry)
					}
				}
			}
			
			entry.editing = editing
			
			//if we're toggling true set our variables
			if (editing) {
				this.$emit("freeze", true)
				this.editing_index = index
				this.editing.shortcut = entry.shortcut
				this.editing.command = entry.command
				this.editing.contexts = entry.contexts.join(", ").toLowerCase()
				//focus when possible
				this.$nextTick(() => {
					let element_to_focus = this.$el.querySelector(".entry" + index + " ." + focusto + " input")
					//the input might not exist if it's a chain_start because the chained commands get edited
					if (element_to_focus) {
						element_to_focus.focus()
					} else {
						//so we have to redo the action on the next tick
						this.$nextTick(() => {
							//we need a new reference to the entry for it to be affected
							let entry = this.shortcuts_list_active[index]
							this.toggle_editing (true, entry, index, focusto)
						})
					}
				})
			} else {
				this.$emit("freeze", false)
				this.editing_index = undefined
				//else send our change
				let change = {
					old_entry: entry,
					new_entry: {
						shortcut: shortcut,
						command: command,
						contexts: contexts,
					},
				}
			
				//only if something changed though
				if (change.new_entry.shortcut !== change.old_entry.shortcut
						|| change.new_entry.command !== change.old_entry.command
						|| change.new_entry.contexts.join() !== change.old_entry.contexts.join()) {
					this.$emit("edit", change)
				}
				//reset our variables
				this.editing.shortcut = ""
				this.editing.command = ""
				this.editing.contexts = "global"
			}
		},
		cancel_edit(entry) {
			entry.editing = false
		},
		check_blur(entry, index) {
			//no need to look at the blur event, which is a mess
			//we know we clicked away and not to another shortcut if editing is true because
			//if we had clicked to another shortcut, editing would have already been set to false
			//when toggled_editing (triggered by the shortcut we clicked to)
			//checked for existing shortcuts with editing true
			if (entry.editing) {
				if (this.options.accept_on_blur) {
					this.toggle_editing(false, entry, index)
				} else {
					this.cancel_edit(entry)
				}
			}
		}
	},
}
</script>
<style lang="scss">

.shortcut-visualizer {
	@import "../settings/theme.scss";

	//when dragged to other places
	.gu-mirror {
		&.context-entry {
			text-transform: capitalize
		}
	}

	.shortcuts {
	margin: $padding-size;
	font-size: $regular-font-size;
	@media (max-width: $regular-media-query){
		font-size: $regular-shrink-amount * $regular-font-size;
	}
	.container {
		border: 1px solid rgba(0,0,0,0.5);
		input {
		font-size: 1em;
		// outline: none;
		padding: 0;
		background: none;
		border: none;
		}
		.edit {
		flex: 1 0 2em;
		order: 1;
		}
		.chain {
		flex: 1 0 1.5em;
		order: 2;
		}
		.shortcut {
		flex: 1 1 20%;
		order: 3;
		}
		.command {
		flex: 1 1 60%;
		order: 4;
		}
		.contexts {
		flex: 1 1 20%;
		order: 5;
		}
		.delete {
		flex: 1 0 1.5em;
		order: 6;
		}
		.entry, .entry-header, .add, .stop-add, .adding {
		box-sizing: border-box;
		border: 1px solid rgba(0,0,0,0.5);
		width:100%;
		display: flex;
		user-select: none;
		& > div { //.shortcut, .command, etc
			padding: 0.3em;
			overflow-x: hidden;
			white-space: nowrap;
		}
				& .list-entry {
					display: inline-block;
					flex: 1 1 100%;
				}
			}
		.entry .contexts {
		text-transform: capitalize;
		// input {
		//    text-transform: capitalize;
		// }
		}
		//because whoever wrote the specs is an idiot
		.editing .command, .editing .contexts {
		overflow-x: unset;
		.list-input {
			width:100%;
			overflow-y: visible;
		} 
		}
		.entry-header, .add, .stop-add {
		font-weight: bold;
		}
		.add, .stop-add {
		text-align: center;
		margin: 0 auto;
		padding: 0.3em;
		display: inline-block;
		cursor: pointer;
		}
		.add, .stop-add {
		color: $accent-color;
		}
		.stop-add {
		color: $dragging-not-allowed-background;
		}
		.adding {
		background: transparentize($accent-color, 0.7);
		.edit {
			text-align: center;
		}
		& > div {
			position: relative;
		}
		& > div:not(.chain) input {
			padding: 0.3em;
			position: absolute;
			top:0;
			bottom: 0;
			right: 0;
			left:0;
			width: calc(100% - 0.3em);
		}
		.chain {
			input {
			height: 1em;
			width: 1em;
			}
		}
		}
		.entry, .adding {
		& > div { //.shortcut, .command, etc
			display: flex;
			justify-content: flex-start;
			&:not(.chain):hover {
			cursor: pointer;
			}
		}
		.gu-transit {
			display: none;
		}
		&.dragging .gu-transit  {
			display: none;
			&:hover {
			display: block;
			}
		}
		&.editing{
			background: transparentize($dragging-will-be-replaced, 0.7);
			& > div {  //.shortcut, .command, etc
			position: relative;
			input {
				padding: 0.3em;
				position: absolute;
				top:0;
				bottom: 0;
				right: 0;
				left:0;
				width: calc(100% - 0.3em);
			}
			}
		}
		.edit {
			display: flex;
			justify-content: space-around;
			align-items: center;
		}
		transition: background-color 0.3s ease-out;
		&.changed {
			background: fade-out($accent-color, 0.7) !important;
		}
		}
	}
	}
}
</style>