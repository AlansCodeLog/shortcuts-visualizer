<template>
   <div class="shortcuts">
      <div class="container">
         <div class="entry-header">
            <div class="edit"></div>
            <div class="shortcut">Shortcut</div>
            <div class="command">Command</div>
            <div class="context">Context</div>
         </div>
         <div
            :class="['entry', 'entry'+index, entry.changed ? 'changed' : '']"
            v-for="(entry, index) of shortcuts_active" :key="entry.shortcut+entry.command"
         >  
            <div :class="['edit', entry.editing ? 'editing' : '']">
               <!-- Edit -->
               <span
                  v-if="!entry.editing"
                  class="button"
                  @click="toggle_editing(true, entry, index)"
               >&#10000;</span>
               <!-- Cancel -->
               <span
                  v-if="entry.editing"
                  class="button"
                  @click="cancel_edit(entry)"
               >&#10006;</span>
               <!-- Enter -->
               <span
                  v-if="entry.editing"
                  class="button"
                  @click="toggle_editing(false, entry, index)"
               >&#10004;</span>
            </div>
            <div :class="['drag', 'shortcut', entry.editing ? 'editing' : '']">
               <!-- NOT EDITING -->
               <div
                  class="text"
                  v-if="!entry.editing"
                  @click="toggle_editing(true, entry, index)"
               >{{entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")}}</div>
               <!-- note: don't leave spaces between {{variables}} -->
               <!-- EDITING -->
               <input
                  v-if="entry.editing"
                  v-model="shortcut_editing"
                  @keydown.enter="toggle_editing(false, entry)"
                  @blur="check_blur($event, entry)"
               />
            </div>
            <div :class="['drag', 'command', entry.editing ? 'editing' : '']">
               <!-- NOT EDITING -->
               <div
                  class="text"
                  @click="toggle_editing(true, entry, index, 'command')"
                  v-if="!entry.editing"
               >{{entry.command}}</div>
               <!-- EDITING -->
               <input
                  v-if="entry.editing"
                  v-model="shortcut_editing_command"
                  @keydown.enter="toggle_editing(false, entry, index)"
                  @blur="check_blur($event, entry)"
               />
            </div>
            <div :class="['drag', 'context', entry.editing ? 'editing' : '']">
               CONTEXT TODO
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
      }
   },
   methods: {
      update_shortcuts($event) {
         this.$emit("edit", $event.target.value)
      },
      toggle_editing (editing, entry, focus_index, focusto = 'shortcut') {
         this.shortcuts.map(entry => entry.editing = false)
         entry.editing = editing
         if (editing) {
            this.shortcut_editing = entry.shortcut
            this.shortcut_editing_command = entry.command
            this.$nextTick(() => {
               this.$el.querySelector(".entry" + focus_index + " ." + focusto + " input").focus()
            })
         } else {
            this.$emit("edit", {
               old_entry: entry,
               new_entry: {
                  shortcut: this.shortcut_editing,
                  command: this.shortcut_editing_command,
               }
            })
            this.shortcut_editing = ""
            this.shortcut_editing_command = ""
         }
      },
      cancel_edit(entry, all = false) {
         entry.editing = false
         this.shortcut_editing=""
         this.shortcut_editing_command=""
      },
      check_blur(e, entry) {
         if (this.options.accept_on_blur) {
            this.$nextTick(() => {
               if (document.activeElement.tagName !== "INPUT") {
                  this.toggle_editing(false, entry)
               }
            })
         } else {
            this.$nextTick(() => {
               if (document.activeElement.tagName !== "INPUT") {
                  this.cancel_edit(entry)
               }
            })
         }
      }
   },
   computed: {
   },
   mounted() {
      let container_keys = document.querySelectorAll(".entry > .text")
      
      let drake = dragula([...container_keys], {
         mirrorContainer: this.$el,
         revertOnSpill: true,
         isContainer: function (el) {
            return el.classList.contains("drag")
         },
         moves: function (el, source, handle, sibling) {
            return el.classList.contains("text")
         },
         accepts: (el, target, source, sibling) => {
            let type = _.without(source.classList, "drag")[0]
            
            if (target.classList.contains(type)) {
               if (type == "command" || type == "shortcut") {
                  if (!this.chain.in_chain) {
                     let combo = target.parentNode.querySelector(".shortcut .text").innerText
                     let existing = this.shortcuts_active.findIndex(entry => entry.shortcut == combo)
                     if (!this.shortcuts_active[existing].chain_start) {return true}
                  } else {
                     return true
                  }
                  el.classList.remove("will_replace")
                  this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
                  target.classList.add("unselectable")
               }
            }
            //ELSE
            return false
         },
      })
      drake
      .on("drag", ()=> {
         this.$emit("freeze_input", true)
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
      .on("drop", (el, target, source, sibling)=> {
         let type = _.without(source.classList, "drag")[0]
         if (type == "command" || type == "shortcut") {
            let combo =  target.parentNode.querySelector(".shortcut .text:not(.gu-transit)").innerText
            combo = keys_from_text(combo, this)
            let combo_normalized = combo.shortcut
            combo = combo._shortcut
            let old_combo = type == "command" 
               ? source.parentNode.querySelector(".shortcut .text").innerText
               : el.innerText
            let oldentry = this.shortcuts_active.filter(entry => {
               return entry.shortcut == old_combo
            })[0]
            
            var change = {
               old_entry: oldentry,
               new_entry: {
                  _shortcut: combo,
                  shortcut: combo_normalized,
                  command: oldentry.command,
               }
            }
            this.$emit("edit", {...change, flip: type == "command" ? false : true})
            
            drake.cancel()
         } else {
            drake.cancel()
         }
      }).on("cancel", (el, target, source, sibling)=> {
         this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
         this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
         this.$el.querySelectorAll(".will_replaced").forEach(el => el.classList.remove("will_replaced"))
         this.$emit("freeze_input", false)
      })
   },
}
</script>
<style lang="scss" scoped>


@import "../settings/theme.scss";
@import "../settings/custom_dragula.scss";

.shortcuts {
   padding: 30px;
   margin: 0 auto;
   font-size: $regular-font-size;
   @media (max-width: $regular-media-query){
      font-size: $regular-shrink-amount * $regular-font-size;
   }
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
   .entry, .entry-header {
      border: 1px solid rgba(0,0,0,0.5);
      width:100%;
      display: flex;
      user-select: none;
      & > div {
         // flex: 1 1 33%;
         padding: 0.3em;
         overflow: hidden;
         white-space: nowrap;
      }
      & .text {
         display: inline-block;
         flex: 1 1 100%;
      }
   }
   .entry {
      & > div {
         display: flex;
         justify-content: flex-start;
      }
      .will_replace { //will_replace, in the list it's always will_replace
         order: 2;   
         margin-left: 2em;
         flex: 0 1 auto;
      }
      .will_be_replaced {
         order: 1;
         flex: 0 1 auto;
      }
      .unselectable {
         background: red;
      }
   }
   .editing {
      background: darkgray;
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
      }
   }
   .edit {
      flex: 1 0 2em;
      order: 1;
      display: flex;
      justify-content: space-around;
      span {
         line-height: 1em;
      }
   }
   .entry {
      transition: color .2s ease-out;
   }
   .changed {
      color: rgb(126, 126, 255);
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
   .entry-header {
      font-weight: bold;
   }
   &::after {
      content: "";
   }
}
</style>