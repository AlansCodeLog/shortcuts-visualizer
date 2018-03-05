<template>
   <div class="shortcuts">
      <div class="container">
         <div class="entry-header">
            <div class="edit"></div>
            <div class="chain" title="Chain Start"></div>
            <div class="shortcut">Shortcut</div>
            <div class="command">Command</div>
            <div class="context">Context</div>
         </div>
         <div
            :class="['entry', entry.editing ? 'editing' : '', 'entry'+index, entry.changed ? 'changed' : '', entry.dragging ? 'dragging' : '']"
            v-for="(entry, index) of shortcuts_active" :key="entry.shortcut+entry.command"
         >  
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
            <div v-if="entry.chain_start" class="chain is_chain" title="Chain Start">&#128279;</div>
            <div v-else class="chain not_chain"></div>
            <div :class="['drag', 'shortcut']">
               <!-- NOT EDITING -->
               <div
                  class="text"
                  v-if="!entry.editing"
                  @click="toggle_editing(true, entry, index)"
               >{{entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")}}</div>
               <!-- note: don't leave spaces between {{variables}} -->
               <!-- EDITING -->
               <input
                  class="dont_blur"
                  v-if="entry.editing"
                  v-model="shortcut_editing"
                  @keydown.enter="toggle_editing(false, entry, index)"
                  @blur="check_blur($event, entry, index)"
               />
            </div>
            <div :class="['drag', 'command']">
               <!-- NOT EDITING -->
               <div
                  class="text"
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
            <div :class="['drag', 'context']">
               TODO
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
   props: ["shortcuts", "shortcuts_active", "normalize", "options", "chain", "keymap", "modifiers_order", "modifiers_names"],
   data () {
      return {
         shortcut_editing: "",
         shortcut_editing_command: "",
         // focus_timer: undefined
      }
   },
   methods: {
      update_shortcuts($event) {
         this.$emit("edit", $event.target.value)
      },
      toggle_editing (editing, entry, focus_index, focusto = 'shortcut', check_existing = true) {
         //we need to keep a reference to the original values in case we accept_on_blur
         let shortcut_editing = this.shortcut_editing
         let shortcut_editing_command = this.shortcut_editing_command
         
         if (check_existing) {
            let existing = this.shortcuts_active.findIndex(entry => entry.editing)

            if (existing !== -1) {
               let existing_entry = this.shortcuts_active[existing]
               if (this.options.accept_on_blur) {
                  this.toggle_editing(false, existing_entry, focus_index, undefined, false)
               } else {
                  this.cancel_edit(existing_entry)
               }
            }
         }
         
         entry.editing = editing
         
         if (editing) {
            this.shortcut_editing = entry.shortcut
            this.shortcut_editing_command = entry.command
            this.$nextTick(() => {
               let element_to_focus = this.$el.querySelector(".entry" + focus_index + " ." + focusto + " input")
               //the input might not exist if it's a chain_start because the chained commands get edited
               if (element_to_focus) {
                  element_to_focus.focus()
               } else {
                  //so we have to redo the action on the next tick
                  this.$nextTick(() => {
                     //we need a new reference to the entry for it to be affected
                     let entry = this.shortcuts_active[focus_index]
                     this.toggle_editing (true, entry, focus_index, focusto)
                  });
               }
            })
         } else {
            let change = {
               old_entry: entry,
               new_entry: {
                  shortcut: shortcut_editing,
                  command: shortcut_editing_command,
               },
            }
            if (!check_existing) {
               if (change.new_entry.shortcut !== change.old_entry.shortcut
               || change.new_entry.command !== change.old_entry.command) {
                  this.$emit("edit", change)
               }
               this.shortcut_editing = ""
               this.shortcut_editing_command = ""
            }
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
   computed: {
   },
   mounted() {
      let container_keys = document.querySelectorAll(".entry > .text")
      
      let drake = dragula([...container_keys], {
         mirrorContainer: this.$el.querySelector(".container"),
         revertOnSpill: true,
         isContainer: function (el) {
            return el.classList.contains("drag")
         },
         moves: function (el, source, handle, sibling) {
            return el.classList.contains("text")
         },
         accepts: (el, target, source, sibling) => {
            let type = _.without(source.classList, "drag")[0]

            this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

            if (target.classList.contains(type)) {
               let source_is_chain = source.parentNode.querySelector(".chain").classList.contains("is_chain")
               let target_is_chain = target.parentNode.querySelector(".chain").classList.contains("is_chain")
               
               if (type == "shortcut") {
                  let source_shortcut = el.innerText.split(" ")
                  let target_shortcut = target.parentNode.querySelector(".shortcut .text:not(.gu-transit)").innerText.split(" ")
                  //chained should not be able to drag to it's chain start and vice versa
                  if (target_shortcut[0] == source_shortcut[0]) {
                     if (!(target_shortcut.length > 1 && source_is_chain) && !(source_shortcut.length > 1 && target_is_chain)) {
                        return true
                     }
                  } else {
                     return true
                  }
               } else if (type == "command" && source_is_chain == target_is_chain) {
                  //only chains can drag to chains and only non-chains to non-chains
                  return true
               }
            }
            //ELSE
            target.classList.add("unselectable")
            return false
         },
      })
      drake
      .on("drag", (el, source)=> {
         this.$emit("freeze", true)
         let entry_index = _.without(source.parentNode.classList, "entry")[0]
         entry_index = entry_index.slice(5, entry_index.length)
         this.shortcuts_active[entry_index].dragging = true
      })
      .on("over", (el, container, source) => {
         let type = _.without(container.classList, "drag")[0]

         let siblings = container.parentNode.querySelectorAll("." + type + " .text:not(.gu-transit)")
         let siblings_length = siblings.length
         
         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

         if (siblings_length > 0) {
            el.classList.add("will_replace")
            siblings.forEach(el => el.classList.add("will_be_replaced"))
         } else {
            el.classList.remove("will_replace")
         }
      })
      .on("out", (el, container, source) => {
         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
      }) 
      .on("drop", (el, target, source, sibling)=> {
         let type = _.without(source.classList, "drag")[0]

         let target_combo =  target.parentNode.querySelector(".shortcut .text:not(.gu-transit)").innerText
         target_combo = keys_from_text(target_combo, this)
         let source_combo = type == "shortcut"
            ? el.innerText
            : source.parentNode.querySelector(".shortcut .text").innerText
         let source_old_entry = this.shortcuts_active.filter(entry => {
            return entry.shortcut == source_combo
         })[0]
         if (type == "shortcut") {
            let change = {
               old_entry: source_old_entry,
               new_entry: {
                  _shortcut: target_combo._shortcut,
                  shortcut: target_combo.shortcut,
                  command: source_old_entry.command,
               }
            }
            
            this.$emit("edit", change)
         } else {
            let target_command = target.parentNode.querySelector(".command .text:not(.gu-transit)").innerText
            let change = {
               old_entry: source_old_entry,
               new_entry: {
                  _shortcut: source_old_entry._shortcut,
                  shortcut: source_old_entry.shortcut,
                  command: target_command,
               }
            }
            let target_entry = this.shortcuts_active.filter(entry => {
               return entry.shortcut == target_combo.shortcut
            })[0]

            let change2 = {
               old_entry: target_entry,
               new_entry: {
                  _shortcut: target_entry._shortcut,
                  shortcut: target_entry.shortcut,
                  command: source_old_entry.command,
               }
            }
            console.log(change, change2)
            
            this.$emit("edit", change)
            this.$emit("edit", change2)
         }
         drake.cancel()
      }).on("cancel", (el, target, source, sibling)=> {
         this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))
         this.shortcuts_active.map(entry => entry.dragging = false)
         this.$emit("freeze", false)
      })
   },
}
</script>
<style lang="scss" scoped>


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
      .context {
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
         & .text {
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
         &.dragging .gu-transit {
            display: none;
            &:hover {
               display: block;
            }
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