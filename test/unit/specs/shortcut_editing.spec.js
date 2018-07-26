import { expect } from "chai"
import sinon from "sinon"
import { shallowMount } from "@vue/test-utils"

import ShortcutVisualizer from "@/Shortcut_Visualizer.vue"
import { layout } from "@/settings/layout.js"
import { keys, modifiers_order } from "@/settings/keys.js"
import { defaults } from "@/defaults.js"

let base_options = {
	keys_list: keys,
	// shortcuts_list: [],
	layout: layout
	// commands: [],
	// modifiers_order: modifiers_order,
}

let original_console_error = console.error
let console_stub = sinon.stub()

describe("shortcut editing - validation - new entries", () => {
	beforeEach(function() {
		console_stub.resetHistory()
		console.error = original_console_error
	})
	it("adding a shortcut should work", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: { keys_list: keys, layout }
		})
		let entry = wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "somecommand",
			contexts: ["some", "contexts"] // must already be lowercase
		})
		for (let property of ["error", "to_add", "to_remove"]) {
			expect(entry[property]).to.be.false
		}
		expect(entry.entry.chained).to.be.false
		expect(entry.entry.chain_start).to.be.false
		expect(entry.entry.shortcut).to.equal("Ctrl+A")
		expect(entry.entry._shortcut).to.deep.equal([["ControlRight", "ControlLeft", "KeyA"].sort()])
		expect(entry.entry.command).to.equal("somecommand")
		expect(entry.entry.contexts).to.deep.equal(["some", "contexts"].sort())
	})
	it("should call set_error when no shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: { keys_list: keys, layout },
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.vm.validate_entry({
			shortcut: "",
			command: "somecommand",
			contexts: "Some, Contexts"
		})
		expect(wrapper.vm.set_error.calledOnce).to.be.true
		expect(wrapper.vm.set_error.getCall(0).args[0].message).to.include("shortcut")
	})
	it("should not error when no command", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: { keys_list: keys, layout },
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "",
			contexts: "Some, Contexts"
		})
		expect(wrapper.vm.set_error.callCount).to.equal(0)
	})
	it("should handle non-array contexts", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: { keys_list: keys, layout }
		})
		let entry = wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "somecommand",
			contexts: "some, contexts" // must already be lowercase
		})
		expect(entry.entry.contexts).to.deep.equal(["some", "contexts"].sort())
	})
	it("should redirect create_shortcut_entry errors", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+illegalkey",
			command: "some command",
			contexts: "global"
		})

		expect(wrapper.vm.set_error.calledOnce).to.be.true
		expect(wrapper.vm.set_error.getCall(0).args[0].message).to.include("key").and.to.include("illegalkey")
	})

	it("should not allow duplicate shortcuts", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "some conflicting shortcut"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "somecommand",
			contexts: "global"
		})

		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")
	})
	it("should allow \"duplicate\" shortcuts with non-conflicting contexts", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "some conflicting shortcut"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "somecommand",
			contexts: "othercontext"
		})

		expect(wrapper.vm.set_error.callCount).to.equal(0)
	})
	it("should not allow creating a shortcut that requires a base chain start that is already an existing shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "some conflicting shortcut"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a a",
			command: "somecommand",
			contexts: "global"
		})

		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("should be chain existing")
	})
})

describe("shortcut editing - validation - editing existing", () => {
	beforeEach(function() {
		console_stub.resetHistory()
		console.error = original_console_error
	})

	it("should allow editing command of any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original" },
					{ shortcut: "ctrl+b", command: "original", chain_start: true },
					{ shortcut: "ctrl+b b", command: "original" }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "global",
			index: 0,
		}, false)

		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "global",
			index: 1,
		}, false)

		expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("duplicate chain start")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "global",
			index: 2,
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.validate_error.getCall(2).args[1].code).to.equal("duplicate shortcut")
	})
	it("should allow editing context (simple) of any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original", contexts: ["a"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["a"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["a"] }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "b",
			index: 0,
		}, false)

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "b",
			index: 1,
		}, false)

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "b",
			index: 2,
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.validate_error.callCount).to.equal(0) // because the context won't conflict with original
	})
	it("should allow adding a (non-conflicting) context to any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original", contexts: ["a"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["a"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["a"] }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "a, b",
			index: 0,
		}, false)

		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "a, b",
			index: 1,
		}, false)

		expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("duplicate chain start")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "a, b",
			index: 2,
		}, false)

		expect(wrapper.vm.validate_error.getCall(2).args[1].code).to.equal("duplicate shortcut")

		expect(wrapper.vm.set_error.callCount).to.equal(0)
	})
	// DOING
	it("should not changing to a conflicting context on any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original", contexts: ["a"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["a"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["a"] },
					{ shortcut: "ctrl+a", command: "original", contexts: ["b"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["b"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["b"] }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "b",
			index: 0,
		}, false)

		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "b",
			index: 1,
		}, false)

		expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("duplicate chain start")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "b",
			index: 2,
		}, false)

		expect(wrapper.vm.validate_error.getCall(2).args[1].code).to.equal("duplicate shortcut")
		expect(wrapper.vm.set_error.callCount).to.equal(3)
	})
	it("should not allow adding a conflicting context on any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original", contexts: ["a"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["a"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["a"] },
					{ shortcut: "ctrl+a", command: "original", contexts: ["b"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["b"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["b"] }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "a, b",
			index: 0,
		}, false)

		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "a, b",
			index: 1,
		}, false)

		expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("duplicate chain start")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "a, b",
			index: 2,
		}, false)

		expect(wrapper.vm.validate_error.getCall(2).args[1].code).to.equal("duplicate shortcut")
		expect(wrapper.vm.set_error.callCount).to.equal(3)
	})
	it("should not allow creating a shortcut that requires a base chain start that is already an existing shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "some conflicting shortcut"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a a",
			command: "somecommand",
			contexts: "global"
		})

		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("should be chain existing")
	})
})