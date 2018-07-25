<template>
	<div :class="['shortcuts', nice_scrollbars ? 'nice-scrollbars': '']">
		<div class="container">
			<add_entry
				:adding="adding"
				:contexts="contexts"
				:active_context="active_context"
				:commands="commands"
				:validate_entry="validate_entry"
				@add="$emit('add', $event)"
				@adding="toggle_adding(true)"
				@cancel="toggle_adding(false)"
			></add_entry>

			<div class="entry-header">
				<div class="edit"></div>
				<div class="chain" title="Chain Start"></div>
				<div class="shortcut">Shortcut</div>
				<div class="command">Command</div>
				<div class="contexts">Contexts</div>
				<div class="delete" title="delete"></div>
			</div>
			<div
				:class="['entry-wrapper', `entry-wrapper${index}`]"
				v-for="(entry, index) of shortcuts_list_active"
				:key="entry.shortcut+entry.command"
			>
				<editing_entry
					ref="shortcut_being_edited"
					v-if="entry.editing"
					v-bind="{ entry, editing_index, shortcuts_list_active, contexts, commands, index }"
					@edit="toggle_editing({editing: false, entry, edit: $event, index})"
					@delete="remove(index)"
					@cancel="cancel_edit(entry)"
					@blur="check_blur(entry, $event, index)"
				></editing_entry>
				<regular_entry
					v-if="!entry.editing"
					v-bind="{ entry, shortcuts_list_active, index, normalize, capitalize}"
					@delete="remove(index)"
					@edit="toggle_editing({editing: true, entry, index, focusto: $event})"
				></regular_entry>
			</div>
		</div>
	</div>
</template>

<script>

import dragula from "dragula"
import list_input from "./shortcut_list/list_input"
import add_entry from "./shortcut_list/add_entry"
import editing_entry from "./shortcut_list/editing_entry"
import regular_entry from "./shortcut_list/regular_entry"

export default {
	name: "Shortcuts",
	props: ["freeze", "commands", "contexts", "keymap", "options", "nice_scrollbars", "shortcuts_list_active", "normalize", "capitalize", "active_context", "validate_entry"],
	components: {
		list_input,
		add_entry,
		editing_entry,
		regular_entry
	},
	data () {
		return {
			editing_index: undefined,
			adding: false,
		}
	},
	methods: {
		remove (index) {
			this.$emit("delete", this.shortcuts_list_active[index])
		},
		toggle_adding(adding) {
			this.$emit("freeze", adding)
			this.adding = adding
		},
		toggle_editing ({ editing, entry, entry_edit, index, focusto = "shortcut", check_existing = true }) {

			// the first time, we want to check if we were editing something (that is we were editing a shortcut then clicked to another) and cancel/accept depending on whether to accept on blur
			// but we don't want to check again when this function calls itself here
			if (check_existing) {

				if (this.editing_index !== undefined) {
					let existing_entry = this.shortcuts_list_active[this.editing_index]
					if (this.options.accept_on_blur) {
						let entry_edit = entry_edit || this.$refs.shortcut_being_edited[0].edit

						this.toggle_editing({ editing: false, entry: existing_entry, entry_edit, index, check_existing: false })
					} else {
						this.cancel_edit(existing_entry)
					}
				}
			}

			// if we're toggling true set our variables
			if (editing) {
				entry.editing = editing
				this.$emit("freeze", true)
				this.editing_index = index
				// focus when possible
				this.$nextTick(() => {
					let element_to_focus = this.$el.querySelector(`.entry-wrapper${index} .${focusto} input`)

					// the input might not exist if it's a chain_start because the chained commands get edited
					if (element_to_focus) {
						element_to_focus.focus()
					} else {
					// so we have to redo the action on the next tick
						this.$nextTick(() => {
						// we need a new reference to the entry for it to be affected
							let entry = this.shortcuts_list_active[index]
							this.toggle_editing({ editing: true, entry, index, focusto })
						})
					}
				})
			} else {
				this.$emit("freeze", false)
				this.editing_index = undefined

				entry.editing = editing
				if (!Array.isArray(entry_edit.contexts)) {
					entry_edit.contexts = entry_edit.contexts.toLowerCase().split(/\s*,\s*/g).sort()
				}

				// else send our change
				let change = {
					old_entry: entry,
					new_entry: {
						...entry_edit,
						index: entry.index,
						holder: entry.holder
					},
				}

				// only if something changed though
				if (change.new_entry.shortcut !== change.old_entry.shortcut
						|| change.new_entry.command !== change.old_entry.command
						|| change.new_entry.contexts.join() !== change.old_entry.contexts.join()
						|| change.new_entry.chain_start !== change.old_entry.chain_start) {
					this.$emit("edit", change)
				}
			}
		},
		cancel_edit(entry) {
			entry.editing = false
		},
		check_blur(entry, entry_edit, index) {

			// There's no need to look at the blur event, which is a mess.
			// We can know we clicked away and not to another shortcut if editing is true because
			// if we had clicked to another shortcut, editing would have already been set to false
			// by toggled_editing (triggered by the shortcut we clicked to) which sets everything to false.
			// So it goes => editing 1 => click on 2 => 2 sets everything false => no blur.
			// OR... editing 1 => click on background => editing 1 is still true => blur

			if (this.options.never_blur) {return}
			if (entry.editing) {
				if (this.options.accept_on_blur) {
					this.toggle_editing({ editing: false, entry, entry_edit, index })
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
	// .gu-mirror {
	// 	&.context-entry {
	// 		// text-transform: capitalize;
	// 	}
	// }
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
			.entry, .entry-to-add > .basic, .entry-header {
				box-sizing: border-box;
				border-top: $borders/5 solid rgba(0, 0, 0, 0.5);
				border-bottom: $borders/5 solid rgba(0, 0, 0, 0.5);
				width: 100%;
				display: flex;
				align-items: center;
				user-select: none;
				.command, .contexts, .shortcut, .edit, .chain, .delete  {
					padding: $small-pad-size;
					overflow-x: hidden;
					white-space: nowrap;
					display: flex;
					// .shortcut, .command, .contexts {
					// 	justify-content: flex-start;
					// }
					&:not(.chain):hover {
						cursor: pointer;
					}
					.list-entry {
						overflow: hidden;
					}
				}
				input {
					font-size: 1em;
					// outline: none;
					padding: 0;
					background: none;
					border: none;
				}
				.gu-transit {
					display: none;
				}
				.edit {
					flex: 1 0 $small-pad-size * 6;
					order: 1;
					display: flex;
					justify-content: center;
					align-items: center;
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
			.entry-to-add > .basic, .editing {
				.command, .contexts, .shortcut, .edit, .chain, .delete  {
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
			.entry-header {
				font-weight: bold;
				font-size: 1.1em;
				padding-top: $small-pad-size;
				padding-bottom: $small-pad-size;
				background: rgba(0,0,0,0.2)
			}
		}
	}
}
</style>