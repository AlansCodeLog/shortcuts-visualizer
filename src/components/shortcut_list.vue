<template>
	<div :class="['shortcuts', nice_scrollbars ? 'nice-scrollbars': '']">
	<div class="container">
		<div v-if="!adding" class="add draggable-container" @click="toggle_adding(true)"><div><!--gets filled by css below--></div></div>
		<div v-else class="stop-add" @click="toggle_adding(false)"><div>Cancel</div></div>
		<div v-if="adding" class="adding">
			<div class="edit" @click="add()">
				<span>&#10004;</span>
			</div>
			<div class="chain" title="Chain Start">
				<input
					type="checkbox"
					@keydown.enter="add()"
					@keydown.esc="toggle_adding(false)"
					v-model="entry_to_add.chain_start"
				/>
			</div>
			<div class="shortcut">
				<list_input
					class="shortcut"
					v-model="entry_to_add.shortcut"
					:allow_chain="false"
					@enter="add()"
					@esc="toggle_adding(false)"               
				>
				</list_input>
			</div>
			<div class="command">
				<list_input
					class="command"
					v-model="entry_to_add.command"
					:list="commands"
					:allow_chain="false"
					@enter="add()"
					@esc="toggle_adding(false)"               
				>
				</list_input>
			</div>
			<div class="contexts" >
				<list_input
					class="contexts"
					v-model="entry_to_add.contexts"
					:list="contexts"
					:allow_chain="true"
					@enter="add()"
					@esc="toggle_adding(false)"               
				>
				</list_input>
			</div>
			<div class="delete" title="cancel" @click="toggle_adding(false)">&#10006;</div>
		</div>

		<div class="entry-header">
			<div class="edit"></div>
			<div class="chain" title="Chain Start"></div>
			<div class="shortcut">Shortcut</div>
			<div class="command">Command</div>
			<div class="contexts">Contexts</div>
			<div class="delete" title="delete"></div>
		</div>
		
		<div
			:class="['entry', entry.editing ? 'editing' : '', 'entry'+index, entry.changed ? 'changed' : '', entry.dragging ? 'dragging' : '']"
			v-for="(entry, index) of shortcuts_list_active" :key="entry.shortcut+entry.command"
			:shortcuts_index="shortcuts_list_active[index].index"
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
		<!-- NOT EDITING -->
		<div v-if="!entry.editing && entry.chain_start" class="chain is_chain" title="Chain Start">&#128279;</div>
		<div v-if="!entry.editing && !entry.chain_start" class="chain not_chain"></div>
		<div v-if="entry.editing" class="chain" title="Chain Start">
			<input
				type="checkbox"
				@keydown.enter="add()"
				@keydown.esc="toggle_adding(false)"
				v-model="editing.chain_start"
			/>
		</div>
		
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
		<div class="draggable-container contexts">
			<!-- NOT EDITING -->
			<div
				class="draggable list-entry context-entry"
				@click="toggle_editing(true, entry, index, 'contexts')"
				v-if="!entry.editing"
				v-for="context of entry.contexts"
				:key="context"
			>{{capitalize(context)}}</div>
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
	props: ["freeze", "commands", "contexts", "keymap", "options", "nice_scrollbars", "shortcuts_list_active", "normalize", "capitalize", "active_context", "validate_entry"],
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
				chain_start: false,
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
		toggle_adding(adding) {
			if (adding) {
				this.$emit("freeze", true)
				this.entry_to_add.shortcut = ""
				this.entry_to_add.command = ""
				this.entry_to_add.contexts = this.active_context
				this.entry_to_add.chain_start = false
			} else {
				this.$emit("freeze", false)
			}
			this.adding = adding
		},
		add() {
			let result = this.validate_entry({...this.entry_to_add})
			if (!result) {return}
			
			this.$emit("add", result.entry)
			if (result.extra) {
				this.$emit("add", result.extra)
			}
			//reset
			this.entry_to_add.shortcut = ""
			this.entry_to_add.command = ""
			this.entry_to_add.contexts = this.active_context
			this.entry_to_add.chain_start = false
			this.toggle_adding()
		},
		toggle_editing (editing, entry, index, focusto = "shortcut", check_existing = true) {

			//we need to keep a reference to the original values in case we accept_on_blur
			let shortcut = this.editing.shortcut
			let command = this.editing.command
			let contexts = this.editing.contexts
			let chain_start = this.editing.chain_start
			
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
				this.editing.chain_start = entry.chain_start
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
				
				contexts = contexts.toLowerCase().split(/\s*,\s*/g).sort()

				//else send our change
				let change = {
					old_entry: entry,
					new_entry: {
						shortcut: shortcut,
						command: command,
						contexts: contexts,
						chain_start: chain_start,
						index: entry.index,
						holder: entry.holder
					},
				}
			
				//only if something changed though
				if (change.new_entry.shortcut !== change.old_entry.shortcut
						|| change.new_entry.command !== change.old_entry.command
						|| change.new_entry.contexts.join() !== change.old_entry.contexts.join()
						|| change.new_entry.chain_start !== change.old_entry.chain_start) {
					this.$emit("edit", change)
				}
				//reset our variables
				this.editing.shortcut = ""
				this.editing.command = ""
				this.editing.contexts = "global"
				this.editing.chain_start = false
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
			if (this.options.never_blur) {return}
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
			// text-transform: capitalize;
		}
	}
	&.background-light {
		.shortcut.nice-scrollbars {
			&::-webkit-scrollbar-thumb {
				box-shadow: inset 0 0 10px 10px mix($theme-light-background, black, 50%);
			}
		}
	}
	&.background-dark {
		.shortcuts.nice-scrollbars {
			&::-webkit-scrollbar-thumb {
				box-shadow: inset 0 0 10px 10px mix($theme-dark-background, white, 50%);
			}
		}
	}
	.shortcuts {
		border: $borders/2.5 solid rgba(0, 0, 0, 0.5); //can't be in container because scrolling
		margin: $padding-size;
		font-size: $regular-font-size;
		flex: 0 1;
		overflow-y:auto;
		overflow-x: hidden;
		&.nice-scrollbars {
			$scroll-bar-spacing: 2px;
			&::-webkit-scrollbar {
				width: $borders * 3 + $scroll-bar-spacing * 2;
			}
			// &::-webkit-scrollbar-track {
			// }
			&::-webkit-scrollbar-thumb {
				border-right: $scroll-bar-spacing solid transparent;
				border-left: $scroll-bar-spacing solid transparent;
				border-bottom: $scroll-bar-spacing solid transparent;
				border-top: $scroll-bar-spacing solid transparent;
				//actually background
				box-shadow: inset 0 0 10px 10px black; //set above by theme
			}
		}
		@media (max-width: $regular-media-query) {
			font-size: $regular-shrink-amount * $regular-font-size;
		}
		.container {
			border-right: $borders/2.5 solid rgba(0, 0, 0, 0.5);
			& > div:first-of-type {
				border-top: none;
			}
			& > div:last-of-type {
				border-bottom: none;
			}
			.entry, .adding, .entry-header, .add, .stop-add, {
				box-sizing: border-box;
				border-top: $borders/5 solid rgba(0, 0, 0, 0.5);
				border-bottom: $borders/5 solid rgba(0, 0, 0, 0.5);
				width: 100%;
				display: flex;
				align-items: center;
				user-select: none;
				& > div {
					//.shortcut, .command, headers, etc
					padding: $small-pad-size;
					overflow-x: hidden;
					white-space: nowrap;
				}
				input {
					font-size: 1em;
					// outline: none;
					padding: 0;
					background: none;
					border: none;
				}
				.edit {
					flex: 1 0 $small-pad-size * 6;
					order: 1;
				}
				.chain {
					flex: 1 0 $small-pad-size * 4;
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
					flex: 1 0 $small-pad-size * 2;
					order: 6;
				}
			}
			.entry {
				transition: background-color 0.3s ease-out;
				&.changed {
					background: fade-out($accent-color, 0.7) !important;
				}
				.contexts {
					// text-transform: capitalize;
					.list-entry.context-entry {
						flex: none;
						display: inline-block;
						&::after {
							content: ", ";
							margin-right: $small-pad-size * 2;
						}
						&:not(.gu-transit):last-of-type::after {
							content: "";
							margin-right: 0;
						}
					}
				}
			}
			.entry, .adding, .entry-header {
				& > div {
					//.shortcut, .command, etc
					display: flex;
					.shortcut, .command, .contexts {
						justify-content: flex-start;
					}
					&:not(.chain):hover {
						cursor: pointer;
					}
					.list-entry {
						overflow: hidden;
					}
				}
				.edit {
					display: flex;
					justify-content: center;
					align-items: center;
				}
				.gu-transit {
					display: none;
				}
			}
			.adding, .editing {
				& > div {
					//.shortcut, .command, contexts
					position: relative;
				}
				& > div:not(.chain) input {
					position: absolute;
					top: 0;
					bottom: 0;
					right: 0;
					left: 0;
					padding: $small-pad-size;
					width: calc(100% - #{$small-pad-size * 2});
				}
				//because whoever wrote the overflow specs is an idiot
				.command, .contexts, .shortcut {
					align-self: stretch;
					overflow-x: unset;
					.list-input {
						width: calc(100% - 0.3em); //same as border to hide padding
						overflow-y: visible;
						position: absolute;
						left: 0;
						right: 0;
						top: 0;
						bottom: 0;
					}
				}
			}
			.editing {
				background: transparentize($dragging-will-be-replaced, 0.7);
				.edit {
					justify-content: space-around;
				}
			}
			.entry-header, .add, .stop-add {
				font-weight: bold;
			}
			.entry-header {
				font-size: 1.1em;
				padding-top: $small-pad-size;
				padding-bottom: $small-pad-size;
				background: rgba(0,0,0,0.2)
			}
			.adding {
				background: transparentize($accent-color, 0.7);
				.edit {
					justify-content: center;
				}
			}
			.add, .stop-add {
				text-align: center;
				margin: 0 auto;
				padding: $small-pad-size * 2;
				display: inline-block;
				cursor: pointer;
				font-size: 1.2em;
				& > div {
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
		}
	}
}
</style>