<template>
   <div class="options">
      <div class="option">
         <input id="button-theme" type="checkbox" v-model="theme_dark" @change="change()"/>
         <label for="button-theme">Dark/White Theme</label>
      </div>
      <div class="option">
         <label for="mode-select">Mode:</label>
         <select id="mode-select" v-model="mode" @input="change()">
            <option v-for="keymode in modes" :key="keymode">{{keymode}}</option>
         </select>
      </div>
   </div>
</template>

<script>
export default {
   name: 'Options',
   props: ["options", "modes"],
   data () {
      return {
         theme_dark: this.options.theme_dark,
         mode: this.options.mode
      }
   },
   methods: {
      change() {
         this.$emit("input", {theme_dark: this.theme_dark, mode: this.mode})
      }
   },
}
</script>
<style lang="scss" scoped>

input[type="checkbox"] {
   transform: scale(1.5);
}

.options {
   width:100%;
   height: 2%;
   margin: 0 2px;
   padding: 20px 0;
   display: flex;
   align-items: center;
   .option {
      margin: 0 1em;
   }
   select {
      font-size: 1em;
   }
}
</style>
