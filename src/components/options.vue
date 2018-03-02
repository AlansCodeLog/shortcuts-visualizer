<template>
   <div class="options">
      <div class="option">
         <input id="button-theme" type="checkbox" v-model="theme_dark" @change="change('theme_dark', $event)"/>
         <label for="button-theme">Dark/White Theme</label>
      </div>
      <div class="option">
         <label for="mode-select">Mode:</label>
         <select id="mode-select" v-model="mode" @input="change('mode', $event)">
            <option v-for="keymode in modes" :key="keymode">{{keymode}}</option>
         </select>
      </div>
      <div class="option">
         <input id="accept-on-blur" type="checkbox" v-model="accept_on_blur" @change="change('accept_on_blur', $event)"/>
         <label for="accept-on-blur">Editing: Accept on Click Away</label>
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
         mode: this.options.mode,
         accept_on_blur: this.options.accept_on_blur
      }
   },
   methods: {
      change(key,e) {
         // this[key] = e.target.value
         this.$emit("input", {theme_dark: this.theme_dark, mode: this.mode, accept_on_blur: this.accept_on_blur})
      }
   },
}
</script>
<style lang="scss" scoped>

@import "../settings/theme.scss";


//TODO fix checkbox

input[type="checkbox"] {
   transform: scale(1.5);
   margin:0 0.2em;
   vertical-align: -0.1em;
   @media (max-width: $regular-media-query){
      transform: scale($regular-shrink-amount*1.5);
      vertical-align: -0.15em;
   }
}

.options {
   width:100%;
   height: 2%;
   padding: $padding-size;
   display: flex;
   align-items: center;
   font-size: $regular-font-size;
   @media (max-width: $regular-media-query){
      font-size: $regular-shrink-amount * $regular-font-size;
   }
   .option {
      margin: 0 1em;
   }
   select {
      font-size: 1em;
   }
}
</style>
