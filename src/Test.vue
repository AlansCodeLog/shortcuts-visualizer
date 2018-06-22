<template>
	<div class="test">
		<TestChild></TestChild>
	</div>
</template>

<script>
import TestChild from "./testchild"
import Vue from "vue"
export default {
	name: "test",
	components: {TestChild},
	mixins: [{
		methods: {
			what_the_hell() {
				console.log("here")
				
			}
		}
	}],
	data () {
		return {
			
		}
	},
	methods: {
		
	},
	created() {
		
	},
}
</script>
<style lang="scss" scoped>
</style>