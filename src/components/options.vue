<template>
   <div class="options">
      <div class="row">
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
      <div class="row contexts" v-if="contexts.length > 1">
         <div class="contexts-list" title="Contexts">
            <div
               :class="['context-select', context == options.context ? 'active' : '']"
               v-for="context in contexts"
               :key="context"
               @click="change('context', context)"
            >{{context}}</div>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'Options',
   props: ["contexts", "modes", "options"],
   data () {
      return {
         theme_dark: this.options.theme_dark,
         mode: this.options.mode,
         context: this.options.context,
         accept_on_blur: this.options.accept_on_blur
      }
   },
   methods: {
      change(key, value) {
         if (key == "context") {
            this[key] = value
         }
         let current = {theme_dark: this.theme_dark, mode: this.mode, context: this.context, accept_on_blur: this.accept_on_blur}
         this.$emit("input", current)
      }
   },
}
</script>
<style lang="scss">

@import "../settings/theme.scss";


//TODO fix checkbox


.options {
   padding: $padding-size;
   padding-bottom: $padding-size/2;
   .row {
      width:100%;
      padding: $padding-size/4 0;
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
   .contexts {
      .contexts-list {
         text-transform: capitalize;
         padding: $padding-size/2 0;
         margin-top: $padding-size/2;
         font-weight:bold;
         flex: 1 1 auto;
         display: flex;
         justify-content: center;
         box-sizing: border-box;
         border: 2px solid rgba(0,0,0,0);
         .context-select {
            flex: 0 0 auto;
            padding: 0 $padding-size;
            display: block;
            cursor: pointer;
         }
         .active {
            color: mix(white, hsla(hue($accent-color), 100%, 50%, 1), 20%);
         }
      }
   }
   input[type="checkbox"] {
      transform: scale(1.5);
      margin:0 0.2em;
      vertical-align: -0.1em;
      @media (max-width: $regular-media-query){
         transform: scale($regular-shrink-amount*1.5);
         vertical-align: -0.15em;
      }
   }
}
</style>
