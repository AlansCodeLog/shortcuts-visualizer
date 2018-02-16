<template>
   <div class="keyboard">
      <div
         :class="['key-row', row.length == 0 ? 'empty-row': '']"
         v-for="(row, rindex) of layout"
         :key="rindex"
         :id="'key-row' + rindex"
      >
         <div
            v-if="keys[key]"
            v-for="(key, index) of row"
            :key="index"
            :id=[key]
            :class="[keys[key].classes,
               typeof keymap[keys[key].identifier] !=='undefined'
               && keymap[keys[key].identifier].active === true
                  ? 'pressed'
                  : ''
            ]"
         >
            <div
            :class="[
            keys[key].classes.indexOf('flexspace') !== -1
            || keys[key].classes.indexOf('blank') !== -1
               ? ''
               : 'dec'
            ]">
               <div
                  v-if="
                     keys[key]
                     && !(typeof keys[key].label == 'undefined'
                        || keys[key].ignore == true)
                     "
                  :class="[{label: true}, keys[key].label.classes]"
               >
                  {{keys[key].label.text}}
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>

export default {
   name: 'Keys',
   props: ["options", "layout", "keys", "keymap"],
}
</script>

<style lang="scss" scoped>

@import "../settings/theme.scss";

.pressed > .dec {
   border-color: $pressed-color !important;
}

.key-row {
   // height: $base_size;
   padding-bottom: $base-size;
   height:0;
   display:flex;
   flex-wrap: wrap;
   & > * {
      flex-grow: 0;
      flex-shrink: 0;
   }
}

.empty-row {
   padding-bottom: $base-size/2;
}

.key { 
   width: $base-size;
   // height: 100%;
   border-radius: 2px;
   box-sizing: border-box;
   padding-bottom: $base-size;
   position:relative;
   .label {
      margin:5%;
      overflow: hidden;
   }
   .shrink {
      font-size:0.8rem;
   }
   .dec {
      position:absolute;
      right: $cap-spacing;
      top: $cap-spacing;
      width: calc(100% - #{$cap-spacing*2});
      height: calc(100% - #{$cap-spacing*2});
      box-sizing: border-box;
      box-shadow: $cap-box-shadow;
   }
}

.five {
   width:5%;
   &:nth-child(odd) {
      background:green;
   }
   &:nth-child(even) {
      background:blue;
   }
}

.blank {
   background:none;
   box-shadow:none;
}

.spacer {
   padding-bottom: $base-size;
   width: 0.666 * $base_size;
}

.flexspace {
   padding-bottom: $base-size;
   flex:1 1 auto;
}

.vertical {
   padding-bottom: 2 * $base_size;
}

.space {
   // width:360px;
   width: 6.25 * $base_size;
}
.modifiers {
   // width:60px;
   width: 1.25 * $base_size;
}
.small {
   // width:60px;
   width: 1.5 * $base_size;
}
.medium-small {
   // width:80px;
   width: 1.75 * $base_size;
}
.medium {
   // width:80px;
   width: 2 * $base_size;
}
.medium-large {
   width: 2.25 * $base_size;
   // width:110px;
}
.huge {
   // width:140px;
   width: 2.75 * $base_size;
}
</style>

