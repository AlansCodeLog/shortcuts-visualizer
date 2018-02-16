<template>
   <div class="shortcuts">
      <div class="entry"
         v-for="shortcut of shortcuts_active" :key="shortcut.shortcut+shortcut.command"
      >
         <div>{{shortcut.shortcut}}</div>
         <div>{{shortcut.command}}</div>
      </div>
      {{keymap_active}}
   </div>
</template>

<script>
export default {
   name: 'Shortcuts',
   props: ["keymap", "shortcuts"],
   data () {
      return {
         
      }
   },
   computed: {
      shortcuts_active () {
         return this.shortcuts.filter(entry => {
            if (_.difference(entry._shortcut[0], this.keymap_active).length == 0) {
               return entry
            }
         })
      },
      keymap_active () {
         return Object.keys(this.keymap).filter(identifier => {
            let key = this.keymap[identifier];
            return key.active
         })
      }  
   },
   created() {
      
   },
}
</script>
<style lang="scss" scoped>
.entry {
   display: flex;
   justify-content: space-around
}
</style>