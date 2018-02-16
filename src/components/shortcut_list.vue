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
      none_mods() {
         let keys = []
         Object.keys(this.keymap).filter(keyname => {
            if (!this.mod_codes.includes(keyname) && this.keymap[keyname].toggle == false) {
               keys.push(keyname)
            }
         })
         return keys
      },
      shortcuts_active () {
         return this.shortcuts.filter(entry => {
            console.log(_.difference(entry._shortcut[0], this.keymap_active).filter(keyname => {return !this.none_mods.includes(keyname)}).length);
            if (_.difference(entry._shortcut[0], this.keymap_active).filter(keyname => {return !this.none_mods.includes(keyname)}).length == 0) {
               return entry
            }
            // return entry
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