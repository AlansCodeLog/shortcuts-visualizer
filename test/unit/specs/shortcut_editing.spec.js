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

describe("shortcut editing - validation", () => {
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
		for (let property of ["error", "extra", "invalid", "remove"]) {
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
		let entry = wrapper.vm.validate_entry({
			shortcut: "",
			command: "somecommand",
			contexts: "Some, Contexts"
		})
		expect(wrapper.vm.set_error.calledOnce).to.be.true
		expect(wrapper.vm.set_error.getCall(0).args[0].message).to.include("shortcut")
	})
	it("should call set_error when no command", () => {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: { keys_list: keys, layout },
		})
		wrapper.setMethods({ set_error: sinon.stub() })
		let entry = wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "",
			contexts: "Some, Contexts"
		})
		expect(wrapper.vm.set_error.calledOnce).to.be.true
		expect(wrapper.vm.set_error.getCall(0).args[0].message).to.include("command")
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

		let entry = wrapper.vm.validate_entry({
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

		let entry = wrapper.vm.validate_entry({
			shortcut: "ctrl+a",
			command: "somecommand",
			contexts: "global"
		})

		expect(wrapper.vm.set_error.calledOnce).to.be.true
		expect(wrapper.vm.set_error.getCall(0).args[0].message).to.include("already exists")
	})
	// it.skip("should allow duplicate shortcuts in different context", () => {
	// 	let wrapper = shallowMount(ShortcutVisualizer, {
	// 		propsData: {
	// 			keys_list: keys,
	// 			layout,
	// 			shortcuts_list: [
	// 				{
	// 					shortcut: "ctrl+a",
	// 					command: "some conflicting shortcut"
	// 				}
	// 			]
	// 		}
	// 	})
	// 	wrapper.setMethods({ set_error: sinon.stub() })

	// 	let entry = wrapper.vm.validate_entry({
	// 		shortcut: "ctrl+a",
	// 		command: "somecommand",
	// 		contexts: "othercontext"
	// 	})

	// 	expect(wrapper.vm.set_error.calledOnce).to.be.false
	// })
})