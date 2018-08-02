import { expect } from "chai"
import sinon from "sinon"
import { shallowMount, createLocalVue } from "@vue/test-utils"

import ShortcutVisualizer from "@/Shortcut_Visualizer.vue"
import { layout } from "@/settings/layout.js"
import { keys, modifiers_order } from "@/settings/keys.js"
import { defaults } from "@/defaults.js"

import { exists_entry } from "./helpers.js" // check the tests for this aren't failing before checking here

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
	it("should error when no command", () => {
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
					},
					{
						shortcut: "ctrl+b",
						chain_start: true,
						command: "some conflicting chains start"
					},
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
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			chain_start: true,
			command: "somecommand",
			contexts: "global"
		})
		expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("chain error existing")
		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "somecommand",
			contexts: "global"
		})
		expect(wrapper.vm.validate_error.getCall(2).args[1].code).to.equal("duplicate chain start")
		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: false,
			command: "somecommand",
			contexts: "global"
		})
		expect(wrapper.vm.validate_error.getCall(3).args[1].code).to.equal("chain error new")

		expect(wrapper.vm.set_error.callCount).to.equal(4)
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

		// expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "global",
			index: 1,
		}, false)

		// expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("duplicate chain start")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "global",
			index: 2,
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.validate_error.callCount).to.equal(0)
		// expect(wrapper.vm.validate_error.getCall(2).args[1].code).to.equal("duplicate shortcut")
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

		// expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate shortcut")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "a, b",
			index: 1,
		}, false)

		// expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("duplicate chain start")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "a, b",
			index: 2,
		}, false)

		// expect(wrapper.vm.validate_error.getCall(2).args[1].code).to.equal("duplicate shortcut")
		expect(wrapper.vm.set_error.callCount).to.equal(0)
	})
	it("should allow removing a (non-conflicting) context to any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original", contexts: ["a", "b"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["a", "b"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["a", "b"] }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "a",
			index: 0,
		}, false)

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "a",
			index: 1,
		}, false)

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "a",
			index: 2,
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(0)
	})
	it("should allow removing all contexts (and default to global) to any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original", contexts: ["a", "b"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["a", "b"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["a", "b"] }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		let entry = wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "",
			index: 0,
		}, false)

		let entry1 = wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "",
			index: 1,
		}, false)

		let entry2 = wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "",
			index: 2,
		}, false)

		let results = [entry, entry1, entry2]
		results.forEach(result => expect(result.entry.contexts).to.deep.equal(["global"]))

		expect(wrapper.vm.set_error.callCount).to.equal(3)
		expect(wrapper.vm.set_error.getCall(0).args[0].type).to.equal("warning")
		expect(wrapper.vm.set_error.getCall(1).args[0].type).to.equal("warning")
		expect(wrapper.vm.set_error.getCall(2).args[0].type).to.equal("warning")
	})
	it("should not allow removing all contexts (and default to global) if they already exist in global", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "original", contexts: ["a", "b"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["a", "b"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["a", "b"] },
					{ shortcut: "ctrl+a", command: "original", contexts: ["global"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["global"] },
					{ shortcut: "ctrl+b b", command: "original", contexts: ["global"] }
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "edit",
			contexts: "",
			index: 0,
		}, false)

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: true,
			command: "edit",
			contexts: "",
			index: 1,
		}, false)

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			chained: true,
			command: "edit",
			contexts: "",
			index: 2,
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(6) // for warning and error
		expect(wrapper.vm.set_error.getCall(0).args[0].type).to.equal("warning")
		expect(wrapper.vm.set_error.getCall(1).args[0].type).to.equal("error")
		expect(wrapper.vm.set_error.getCall(2).args[0].type).to.equal("warning")
		expect(wrapper.vm.set_error.getCall(3).args[0].type).to.equal("error")
		expect(wrapper.vm.set_error.getCall(4).args[0].type).to.equal("warning")
		expect(wrapper.vm.set_error.getCall(5).args[0].type).to.equal("error")
	})
	// DOING
	it("should not allow changing to a conflicting context on any type of shortcut", () => {
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
	it("should not allow switching to a shortcut with conflicting contexts on any type of shortcut", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+s", command: "original", contexts: ["a", "b"] },
					{ shortcut: "ctrl+d", command: "original", chain_start: true, contexts: ["a", "b"] },
					{ shortcut: "ctrl+d d", command: "original", contexts: ["a", "b"] },
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
	it("should not allow switching to a shortcut with conflicting contexts (chain related conditions)", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+c", command: "original", chain_start: true, contexts: ["a", "b"] },
					{ shortcut: "ctrl+b", command: "original", chain_start: true, contexts: ["b"] },
					{ shortcut: "ctrl+a", command: "original", contexts: ["b"] },
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })

		wrapper.vm.validate_entry({
			shortcut: "ctrl+b",
			chain_start: false,
			command: "edit",
			contexts: "a, b",
			index: 0,
		}, false)

		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("chain error new")

		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			chain_start: true,
			command: "edit",
			contexts: "a, b",
			index: 0,
		}, false)

		expect(wrapper.vm.validate_error.getCall(1).args[1].code).to.equal("chain error existing")

		expect(wrapper.vm.set_error.callCount).to.equal(2)
	})
	it("should allow creating a shortcut that requires a base chain start that is already an existing shortcut if it's itself", () => {
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
			contexts: "global",
			index: 0
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("should be chain existing")
	})
	it("should not allow creating a shortcut that requires a base chain start that is already an existing shortcut if it isn't itself", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "shortcut to edit"
					},
					{
						shortcut: "ctrl+b",
						command: "some conflicting shortcut",
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			command: "some command",
			contexts: "global",
			index: 0
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("should be chain existing")
	})
	it("should allow creating a shortcut that requires a base chain start that exists", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "shortcut to edit"
					},
					{
						shortcut: "ctrl+b",
						command: "custom chain start",
						chain_start: true
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+b b",
			command: "some command",
			contexts: "global",
			index: 0
		}, false)

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
					},
					{
						shortcut: "ctrl+b",
						command: "command will be editing"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a a",
			command: "somecommand",
			contexts: "global",
			index: 1
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("should be chain existing")
	})
	it("should allow unchaining a chain start without dependents", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						chain_start: true,
						command: "some conflicting chain start"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			chain_start: false,
			command: "not a chain start",
			contexts: "global",
			index: 0
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("chain error new")
	})
	it("should not allow unchaining a chain start with dependents", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						chain_start: true,
						command: "some conflicting chain start"
					},
					{
						shortcut: "ctrl+a a",
						command: "chain start dependent"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			chain_start: false,
			command: "not a chain start",
			contexts: "global",
			index: 0
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("chain error new")
	})
	it("should allow chained to chain start without dependents", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a a",
						command: "some chained command"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			chain_start: true,
			command: "custom chain start",
			contexts: "global",
			index: 0
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate chain start")
	})
	it("should not allow chained to chain start with dependents", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a a",
						command: "some chained command"
					},
					{
						shortcut: "ctrl+a b",
						command: "some chained command"
					}
				]
			}
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		wrapper.setMethods({ validate_error: sinon.spy(wrapper.vm.validate_error) })
		wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			chain_start: true,
			command: "custom chain start",
			contexts: "global",
			index: 0
		}, false)

		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.validate_error.getCall(0).args[1].code).to.equal("duplicate chain start")
	})
})

describe("shortcut editing - editing entries - hand edits", () => {
	let is_hand_edit = true

	it("should allow non-conflicting command edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+a",
			command: "other command",
			contexts: ["global"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should allow non-conflicting shortcut edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command",
			contexts: ["global"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should allow non-conflicting context edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command",
			contexts: ["other context"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should allow non-conflicting adding context edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command",
			contexts: ["global", "other context"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should not allow non-conflicting edits", () => {
		// this can basically cover ALL hand edits because we tested the validation of the entries
		// here we're just testing that when they error we don't edit anything
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command1"
					},
					{
						shortcut: "ctrl+b",
						command: "command2"
					},
				]
			}
		})
		wrapper.setMethods({ validate_entry: sinon.spy(wrapper.vm.validate_entry) })
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		wrapper.setMethods({ set_error: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command1-edited",
			contexts: ["global"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.validate_entry.callCount).to.equal(1)
		expect(wrapper.vm.set_error.callCount).to.equal(1)
		expect(wrapper.vm.shortcuts.length).to.equal(2)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A", command: "command1" })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B", command: "command2" })).to.equal(true)
	})
})

describe("shortcut editing - editing entries - controlled edits - shortcut swaps", () => {
	// note
	// remember when sending shortcut edit the ONLY thing that should change is the shortcut
	// of the new entry, nothing else
	let is_hand_edit = false
	it("should allow non-conflicting command edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+a",
			command: "other command",
			contexts: ["global"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should allow non-conflicting shortcut edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command",
			contexts: ["global"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should allow non-conflicting context edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command",
			contexts: ["other context"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should allow non-conflicting adding context edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command"
					},
				]
			}
		})
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command",
			contexts: ["global", "other context"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(exists_entry(wrapper.vm.shortcuts, { ...edit, changed: false, holder: undefined })).to.equal(true)
		expect(wrapper.vm.shortcut_edit_success.callCount).to.equal(1)
	})
	it("should swap swappable conflicting edit", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a",
						command: "command1",
						contexts: ["global", "originala"]
					},
					{
						shortcut: "ctrl+b",
						command: "command2",
						contexts: ["global", "originalb"]
					},
				]
			}
		})
		wrapper.setMethods({ validate_entry: sinon.spy(wrapper.vm.validate_entry) })
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		wrapper.setMethods({ set_error: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command1",
			contexts: ["global", "originala"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.validate_entry.callCount).to.equal(0)
		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.shortcuts.length).to.equal(2)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B", command: "command1", contexts: ["global", "originala"] })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A", command: "command2", contexts: ["global", "originalb"] })).to.equal(true)
	})
	it("should swap swappable conflicting edit of chained", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a a",
						command: "command1",
						contexts: ["global", "originala a"],
					},
					{
						shortcut: "ctrl+b b",
						command: "command2",
						contexts: ["global", "originalb b"],
					},
					{
						shortcut: "ctrl+a",
						command: "chain start a",
						chain_start: true
					},
					{
						shortcut: "ctrl+b",
						command: "chain start b",
						chain_start: true
					}
				]
			}
		})
		wrapper.setMethods({ validate_entry: sinon.spy(wrapper.vm.validate_entry) })
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		wrapper.setMethods({ set_error: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b b",
			command: "command1",
			contexts: ["global", "originala a"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.validate_entry.callCount).to.equal(0)
		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.shortcuts.length).to.equal(4)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B B", command: "command1", contexts: ["global", "originala a"], })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A A", command: "command2", contexts: ["global", "originalb b"], })).to.equal(true)
	})
	it("should swap swappable conflicting edit of chained w regular non-chained", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a a",
						command: "command1",
						contexts: ["global", "originala a"],
					},
					{
						shortcut: "ctrl+b",
						command: "command2",
						contexts: ["global", "originalb"],
					},
					{
						shortcut: "ctrl+a",
						command: "chain start a",
						chain_start: true
					}
				]
			}
		})
		wrapper.setMethods({ validate_entry: sinon.spy(wrapper.vm.validate_entry) })
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		wrapper.setMethods({ set_error: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "command1",
			contexts: ["global", "originala a"],
			index: 0
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[0],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.validate_entry.callCount).to.equal(0)
		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.shortcuts.length).to.equal(3)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B", command: "command1", contexts: ["global", "originala a"], })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A A", command: "command2", contexts: ["global", "originalb"], })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A", chain_start: true })).to.equal(true)
	})
	it("should swap swappable conflicting edit of regular non-chained w chained", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a a",
						command: "command1",
						contexts: ["global", "originala a"],
					},
					{
						shortcut: "ctrl+b",
						command: "command2",
						contexts: ["global", "originalb"],
					},
					{
						shortcut: "ctrl+a",
						command: "chain start a",
						chain_start: true
					}
				]
			}
		})
		wrapper.setMethods({ validate_entry: sinon.spy(wrapper.vm.validate_entry) })
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		wrapper.setMethods({ set_error: sinon.stub() })
		let edit = {
			shortcut: "ctrl+a a",
			command: "command2",
			contexts: ["global", "originalb"],
			index: 1
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[1],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.validate_entry.callCount).to.equal(0)
		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.shortcuts.length).to.equal(3)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A A", command: "command2", contexts: ["global", "originalb"], })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B", command: "command1", contexts: ["global", "originala a"], })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A", chain_start: true })).to.equal(true)
	})
	it("should swap swappable conflicting edit of chain starts", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a a",
						command: "command1"
					},
					{
						shortcut: "ctrl+b b",
						command: "command2"
					},
					{
						shortcut: "ctrl+a",
						command: "chain start a",
						chain_start: true,
						contexts: ["global", "original c a"],
					},
					{
						shortcut: "ctrl+b",
						command: "chain start b",
						chain_start: true,
						contexts: ["global", "original c b"],
					}
				]
			}
		})
		wrapper.setMethods({ validate_entry: sinon.spy(wrapper.vm.validate_entry) })
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		wrapper.setMethods({ set_error: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "chain start a",
			contexts: ["global", "original c a"],
			index: 2
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[2],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.validate_entry.callCount).to.equal(0)
		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.shortcuts.length).to.equal(4)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B", command: "chain start a", contexts: ["global", "original c a"], chain_start: true })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A", command: "chain start b", contexts: ["global", "original c b"], chain_start: true })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B A", command: "command1", chained: true, chain_start: false })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A B", command: "command2", chained: true, chain_start: false })).to.equal(true)
	})
	it("can swap with chain starts that share same context", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{
						shortcut: "ctrl+a a",
						command: "command1",
						contexts: ["original c a"]
					},
					{
						shortcut: "ctrl+b b",
						command: "command2",
						contexts: ["original c b"],
					},
					{
						shortcut: "ctrl+a",
						command: "chain start a",
						chain_start: true,
						contexts: ["shared", "original c a"]
					},
					{
						shortcut: "ctrl+b",
						command: "chain start b",
						chain_start: true,
						contexts: ["shared", "original c b"],
					}
				]
			}
		})
		wrapper.setMethods({ validate_entry: sinon.spy(wrapper.vm.validate_entry) })
		wrapper.setMethods({ shortcut_edit_success: sinon.stub() })
		wrapper.setMethods({ set_error: sinon.stub() })
		let edit = {
			shortcut: "ctrl+b",
			command: "chain start a",
			contexts: ["shared", "original c a"].sort(),
			index: 2
		}
		wrapper.vm.shortcut_edit(
			{
				old_entry: wrapper.vm.shortcuts[2],
				new_entry: edit
			},
			undefined, // is handled by function, ignore
			is_hand_edit
		)
		expect(wrapper.vm.validate_entry.callCount).to.equal(0)
		expect(wrapper.vm.set_error.callCount).to.equal(0)
		expect(wrapper.vm.shortcuts.length).to.equal(4)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+B", contexts: ["shared", "original c a"].sort(), chain_start: true, command: "chain start a" })).to.equal(true)
		expect(exists_entry(wrapper.vm.shortcuts, { shortcut: "Ctrl+A", contexts: ["shared", "original c b"].sort(), chain_start: true, command: "chain start b" })).to.equal(true)
	})
})