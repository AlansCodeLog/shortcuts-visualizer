<template>
   <div class="shortcuts">
      <div class="container">
         <div class="entry-header">
            <div>Edit</div>
            <div>Shortcut</div>
            <div>Command</div>
         </div>
         <div class="entry"
            v-for="entry of shortcuts_active" :key="entry.shortcut+entry.command"
         >
            <div class="text_shortcut" v-if="!entry.editing">
               <span class="button" @click="toggle_editing(true, entry)">&#10000;</span>
               {{entry.shortcut}}
            </div>
            <div
               v-if="entry.editing"
            >
               <span class="button" @click="entry.editing=false">X</span>
               <input
                  v-model="shortcut_editing"
               />
            </div>
            <div>
               {{normalize(entry._shortcut[0], true).join("+")}}
               {{entry._shortcut.length == 2 ? normalize(entry._shortcut[1], true).join("+") : ""}}
            </div>
            <div class="text_shortcut_command" v-if="!entry.editing">
               {{entry.command}}
            </div>
            <div
               v-if="entry.editing"
            >
               <input
                  v-model="shortcut_editing_command"
               />
               <span class="button" @click="toggle_editing(false, entry)">Done</span>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'Shortcuts',
   props: ["shortcuts_active", "normalize"],
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
      toggle_editing (editing, entry) {
         this.shortcuts_active.map(entry => entry.editing = false)
         entry.editing = editing
         if (editing) {
            this.shortcut_editing = entry.shortcut
            this.shortcut_editing_command = entry.command
         } else {
            this.$emit("edit", {
               oldshortcut: entry.shortcut,
               newshortcut: this.shortcut_editing,
               oldcommand: entry.command,
               newcommand: this.shortcut_editing_command,
            })
            this.shortcut_editing = ""
            this.shortcut_editing_command = ""
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
}
.container {
   border: 3px solid rgba(0,0,0,0.5);
   .entry, .entry-header {
      display: flex;
      div {
         flex: 0 0 33%;
         padding: 1em;
      }
      & > div:nth-child(2), & > div:nth-child(3) {
         border-left: 3px solid rgba(0,0,0,0.5);
      }
   }
   .entry-header {
      font-weight: bold;
   }
   &::after {
      content: "";
   }
}
</style>