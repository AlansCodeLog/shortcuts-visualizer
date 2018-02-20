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
            :class="['entry', 'entry'+index]"
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
            <div :class="['shortcut', entry.editing ? 'editing' : '']">
               <!-- NOT EDITING -->
               <div
                  v-if="!entry.editing"
                  @click="toggle_editing(true, entry, index)"
               >
                  {{normalize(entry._shortcut[0], true).join("+")}}
                  {{entry._shortcut.length == 2 ? normalize(entry._shortcut[1], true)
               .join("+") : ""}}
               </div>
               <!-- EDITING -->
               <input
                  v-if="entry.editing"
                  v-model="shortcut_editing"
                  @keydown.enter="toggle_editing(false, entry)"
                  @blur="check_blur($event, entry)"
               />
            </div>
            <div :class="['command', entry.editing ? 'editing' : '']">
               <!-- NOT EDITING -->
               <div
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
            <div :class="['context', entry.editing ? 'editing' : '']">
               CONTEXT TODO
            </div>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'Shortcuts',
   props: ["shortcuts", "shortcuts_active", "normalize", "options"],
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
               old_shortcut: entry._shortcut,
               newshortcut: this.shortcut_editing,
               oldcommand: entry.command,
               newcommand: this.shortcut_editing_command,
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
   created() {
      
   },
}
</script>
<style lang="scss" scoped>

@import "../settings/theme.scss";

.shortcuts {
   padding: 30px;
   margin: 0 auto;
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
      & > div {
         // flex: 1 1 33%;
         padding: 0.3em;
         overflow: hidden;
      }
      & > div > div {
         display: inline-block;
         word-wrap: none;
         width:100%;
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
      flex: 1 0 3em;
      order: 1;
      display: flex;
      justify-content: space-around;
      span {
         line-height: 1em;
      }
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