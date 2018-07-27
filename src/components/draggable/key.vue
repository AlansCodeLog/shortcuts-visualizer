<template>
	<div
		:class="['draggable', 'key-entry', active_keys[keys[key].identifier].entry.chain_start ? 'is_chain' : '']"
		v-if="
			!keys[key].ignore
			&& !keys[key].is_modifier
			&& active_keys[keys[key].identifier] !== undefined
		"
		:shortcuts_index="active_keys[keys[key].identifier].entry.index"
	>
		<div class="command">{{active_keys[keys[key].identifier].entry.command}}</div>
	</div>
</template>

<script>
export default {
	name: "key",
	props: ["entry"],
}
</script>
<style lang="scss" scoped>
</style>