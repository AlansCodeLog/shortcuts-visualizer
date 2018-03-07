<template>
   <div class="shortcuts">
      <div class="container">
         <div class="entry-header">
            <div class="edit"></div>
            <div class="chain" title="Chain Start"></div>
            <div class="shortcut">Shortcut</div>
            <div class="command">Command</div>
            <div class="contexts">Contexts</div>
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
            <div :class="['drag', 'shortcut']">
               <!-- NOT EDITING -->
               <div
                  class="list-subentry"
                  v-if="!entry.editing"
                  @click="toggle_editing(true, entry, index)"
               >{{entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")}}</div>
               <!-- EDITING -->
               <input
                  class="dont_blur"
                  v-if="entry.editing"
                  v-model="shortcut_editing"
                  @keydown.enter="toggle_editing(false, entry, index)"
                  @blur="check_blur($event, entry, index)"
               />
            </div>

            <!-- COLUMN COMMAND -->
            <div :class="['drag', 'command']">
               <!-- NOT EDITING -->
               <!-- is_chain is needed for styling when dragging to bin -->
               <div
                  :class="['list-subentry', entry.chain_start ? 'is_chain' : '']"
                  @click="toggle_editing(true, entry, index, 'command')"
                  v-if="!entry.editing"
               >{{entry.command}}</div>
               <!-- EDITING -->
               <input
                  class="dont_blur"
                  v-if="entry.editing"
                  v-model="shortcut_editing_command"
                  @keydown.enter="toggle_editing(false, entry, index)"
                  @blur="check_blur($event, entry, index)"
               />
            </div>

            <!-- COLUMN CONTEXTS -->
            <div :class="['drag', 'contexts']">
               <!-- NOT EDITING -->
               <div
                  class="list-subentry"
                  @click="toggle_editing(true, entry, index, 'contexts')"
                  v-if="!entry.editing"
               >{{entry.contexts.join(", ")}}</div>
               <!-- EDITING -->
               <input
                  class="dont_blur"
                  v-if="entry.editing"
                  :value="shortcut_editing_contexts.join(', ')"
                  @keydown.enter="set_contexts($event.target.value);toggle_editing(false, entry, index)"
                  @blur="set_contexts($event.target.value);check_blur($event, entry, index)"
               />
            </div>
         </div>
      </div>
   </div>
</template>

<script>

import dragula from "dragula"
import { keys_from_text } from '../helpers/helpers';
export default {
   name: 'Shortcuts',
   props: ["chain", "keymap", "modifiers_names", "modifiers_order", "normalize", "options", "shortcuts", "shortcuts_list_active"],
   data () {
      return {
         shortcut_editing: "",
         shortcut_editing_command: "",
         shortcut_editing_contexts: [],
      }
   },
   methods: {
      set_contexts (value) {
         //we need to handle transforming the array to text.
         //contexts can have spaces but we check for extra white space before/after the comma
         this.shortcut_editing_contexts = value.split(/\s*,\s*/g)
      },
      toggle_editing (editing, entry, index, focusto = 'shortcut', check_existing = true) {
         //we need to keep a reference to the original values in case we accept_on_blur
         let shortcut_editing = this.shortcut_editing
         let shortcut_editing_command = this.shortcut_editing_command
         let shortcut_editing_contexts = this.shortcut_editing_contexts
         
         //the first time, we want to check if we were editing something (that is we were editing a shortcut then clicked to another) and cancel/accept depending on whether to accept on blur
         //but we don't want to check again when this function calls itself here
         if (check_existing) {
            let existing = this.shortcuts_list_active.findIndex(entry => entry.editing)
            
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
            this.shortcut_editing = entry.shortcut
            this.shortcut_editing_command = entry.command
            this.shortcut_editing_contexts = entry.contexts
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
                  });
               }
            })
         } else if (!check_existing) {
            //else send our change
            let change = {
               old_entry: entry,
               new_entry: {
                  shortcut: shortcut_editing,
                  command: shortcut_editing_command,
                  contexts: shortcut_editing_contexts,
               },
            }
            //only if something changed though
            if (change.new_entry.shortcut !== change.old_entry.shortcut
            || change.new_entry.command !== change.old_entry.command
            || change.new_entry.contexts !== change.old_entry.contexts) {
               this.$emit("edit", change)
            }
            //reset our variables
            this.shortcut_editing = ""
            this.shortcut_editing_command = ""
            this.shortcut_editing_contexts = ["Global"]
         }
      },
      cancel_edit(entry) {
         entry.editing = false
      },
      check_blur(e, entry, index) {
         this.$nextTick(() => {
            //if we don't click on another shortcut
            if (!document.activeElement.classList.contains("dont_blur")) {
               if (this.options.accept_on_blur) {
                  this.toggle_editing(false, entry, index)
               } else {
                  this.cancel_edit(entry)
               }
            }//else toggle edit will handle it
         })
      }
   },
   mounted() {
      let container_keys = this.$el.querySelectorAll(".entry > .list-subentry")
      
      let drake = dragula([...container_keys], {
         mirrorContainer: this.$el, //we want to keep the dragged element within this component to style it apropriately
         revertOnSpill: true, //so cancel will revert position of element
         isContainer: function (el) {
            return el.classList.contains("drag") || el.classList.contains("bin") || el.classList.contains("delete-bin")
         },
         moves: function (el, source, handle, sibling) {
            return el.classList.contains("list-subentry")
         },
         accepts: (el, target, source, sibling) => {
            if (target.classList.contains("delete-bin")) {
               return true
            }
            //gets the type of subentry (shortcut, command, or contexts)
            let type = _.without(source.classList, "drag")[0]

            //clean our classes
            this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

            //only commands can be dragged to the bin
            if (type == "command" && target.classList.contains("bin")) {return true}

            //otherwise we can only drag to a similar type
            if (target.classList.contains(type)) {
               let source_entry = source.getAttribute("index")
               source_entry = this.shortcuts_list_active[source_entry]
               let target_entry = target.getAttribute("index")
               target_entry = this.shortcuts_list_active[target_entry]
               
               if (type == "shortcut") {
                  //chained should not be able to drag to it's chain start and vice versa
                  if (target._shortcut[0] == source._shortcut[0]) {
                     if (!(target.chained && source.chain_start) && !(source.chained && target.chain_start)) {
                        return true
                     }
                  } else {
                     return true
                  }
               } else if (type !== "shortcut" && source.chain_start == target.chain_start) {
                  //only chains can drag to chains and only non-chains to non-chains
                  return true
               }
            }
            //ELSE if anything was false, make the target unselectable (red)
            target.classList.add("unselectable")
            return false
         },
      })
      drake
      .on("drag", (el, source)=> {
         //freeze input over keyboard
         this.$emit("freeze", true)
         //set entry to dragging
         let source_entry = source.parentNode.getAttribute("index")
         source_entry = this.shortcuts_list_active[source_entry]
         source_entry.dragging = true
      })
      .on("over", (el, container, source) => {
         //TODO let is_key = container.classList.contains("key-container")
         let is_list = container.classList.contains("drag")
         if (is_list) {
            let type = _.without(container.classList, "drag")[0]

            //we want to know how many real siblings the target has as sometimes the element might be inserted before/after it's sibling and so we need to manually add the selectors to properly target them with css
            let siblings = container.parentNode.querySelectorAll("." + type + " .list-subentry:not(.gu-transit)")
            let siblings_length = siblings.length

            //clean classes beforehand
            this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
            document.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

            if (siblings_length > 0) {
               el.classList.add("will_replace")
               siblings.forEach(el => el.classList.add("will_be_replaced"))
            } else {
               el.classList.remove("will_replace")
            }
         } else if (container.classList.contains("delete-bin")) {
            container.classList.add("hovering")
         }
      })
      .on("out", (el, container, source) => {
         //sometimes the classes get stuck
         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         document.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
         document.querySelectorAll(".hovering").forEach(el => el.classList.remove("hovering"))
      }) 
      .on("drop", (el, target, source, sibling)=> {
         let type = _.without(source.classList, "drag")[0]

         let source_entry = source.parentNode.getAttribute("index")
         source_entry = this.shortcuts_list_active[source_entry]
         let target_entry = target.parentNode.getAttribute("index")

         if (target.classList.contains("delete-bin")) {
            this.$emit("delete", source_entry)
            drake.cancel()
            return
         }

         if (target.classList.contains("bin")) {
            this.$emit("add_to_bin", source_entry)
         } else {
            target_entry = this.shortcuts_list_active[target_entry]

            if (type == "shortcut") {
               //we only need to emit one change and it will get swapped
               let change = {
                  old_entry: source_entry,
                  new_entry: {
                     _shortcut: target_entry._shortcut,
                     shortcut: target_entry.shortcut,
                     command: source_entry.command,
                  }
               }
               
               this.$emit("edit", change)
            } else {
               //while this is more the equivilent of two edits
               let change = {
                  old_entry: source_entry,
                  new_entry: {
                     _shortcut: source_entry._shortcut,
                     shortcut: source_entry.shortcut,
                     command: type == "command" ? target_entry.command : source_entry.command,
                     contexts: type == "command" ? source.contexts : target_entry.contexts,
                  }
               }

               let change2 = {
                  old_entry: target_entry,
                  new_entry: {
                     _shortcut: target_entry._shortcut,
                     shortcut: target_entry.shortcut,
                     command: type == "command" ? source_entry.command : target_entry.command,
                     contexts: type == "command" ? source_entry.contexts : target_entry.contexts,
                  }
               }
               
               this.$emit("edit", change)
               this.$emit("edit", change2)
            }
         }

         //we don't actually want to drop the element and change the dom, vue will handle rerendering it in the proper place
         drake.cancel()
      }).on("cancel", (el, target, source, sibling)=> {
         //clean css classes
         document.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))
         //in case we missed any, set draggint to false on all
         this.shortcuts_list_active.map(entry => entry.dragging = false)
         //unfreeze input
         this.$emit("freeze", false)
      })
   },
}
</script>
<style lang="scss">


@import "../settings/theme.scss";
@import "../settings/custom_dragula.scss";

.shortcuts {
   padding: $padding-size;
   margin: 0 auto;
   font-size: $regular-font-size;
   @media (max-width: $regular-media-query){
      font-size: $regular-shrink-amount * $regular-font-size;
   }
   .gu-mirror {
      width: auto !important;
      height: auto !important;
   }
   .container {
      border: 1px solid rgba(0,0,0,0.5);
      input {
         font-size: 1em;
         outline: none;
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
         order: 1;
      }
      .command {
         flex: 1 1 60%;
         order: 3;
      }
      .shortcut {
         flex: 1 1 20%;
         order: 2;
      }
      .contexts {
         flex: 1 1 20%;
         order: 4;
      }
      .entry, .entry-header {
         border: 1px solid rgba(0,0,0,0.5);
         width:100%;
         display: flex;
         user-select: none;
         & > div { //.shortcut, .command, etc
            padding: 0.3em;
            overflow: hidden;
            white-space: nowrap;
         }
         & .list-subentry {
            display: inline-block;
            flex: 1 1 100%;
         }
         
      }
      .entry-header {
         font-weight: bold;
      }
      .entry {
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
         .bin-entry.will_replace {
            display: none;
         }
         &.editing{
            background: darkgray;
            & > div {  //.shortcut, .command, etc
               color:black;
               position: relative;
               span {
                  color:black;
               }
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
            span {
               line-height: 1em;
            }
         }
         transition: background-color 0.3s ease-out;
         &.changed {
            background: fade-out($accent-color, 0.7) !important;
         }
      }
   }
}
</style>