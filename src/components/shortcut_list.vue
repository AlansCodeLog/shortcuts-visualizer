<template>
   <div class="shortcuts">
      <div class="container">
         <div class="entry-header">
            <div>Edit</div>
            <div>Shortcut</div>
            <div>Command</div>
         </div>
         <div class="entry"
            v-for="shortcut of shortcuts_active" :key="shortcut.shortcut+shortcut.command"
         >
            <input v-bind:value="shortcut.shortcut" @input="update_shortcuts($event)"/>
            <div>
               {{normalize(shortcut._shortcut[0], true).join("+")}}
               {{shortcut._shortcut.length == 2 ? normalize(shortcut._shortcut[1], true).join("+") : ""}}
               </div>
            <div>{{shortcut.command}}</div>
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
         
      }
   },
   methods: {
      update_shortcuts($event) {
         this.$emit("edit", $event.target.value)
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
         flex: 0 0 50%;
         padding: 1em;
      }
      & > div:nth-child(2) {
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