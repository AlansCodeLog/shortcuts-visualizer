<template>
	<div
		:class="['key-container', key_info.ignore ? '' : 'draggable-container']"
	>
		<!-- the actual shortcut entry command, this is what gets dragged if we drag -->
		<div
			:class="['draggable', 'key-entry', active_keys[key_info.identifier].entry.chain_start ? 'is_chain' : '']"
			v-if="
				!key_info.ignore
				&& !key_info.is_modifier
				&& active_keys[key_info.identifier] !== undefined
			"
			:shortcuts_index="active_keys[key_info.identifier].entry.index"
		>
			<div class="command">{{active_keys[key_info.identifier].entry.command}}</div>
		</div>
	</div>
</template>
<script>
export default {
	name: "Add-Entry",
	props: ["key_info", "active_keys"],
}
</script>