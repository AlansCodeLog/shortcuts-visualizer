<template>
   <input
      :value="value"
      @blur="$emit('blur', $event)"
      @keydown.enter="$emit('toggle', $event)"
      @input="$emit('input', $event.target.value)"
   />
</template>

<script>
export default {
   name: 'input_component',
   props: ["value", "focus", "type"],
   components: {},
   created () {
      console.log("wtf");
   },
   mounted() {
      console.log(this.focus, this.type);
      if (this.focus == this.type) {
         this.$el.focus()
      }
   },
}
</script>
<style lang="scss" scoped>
</style>