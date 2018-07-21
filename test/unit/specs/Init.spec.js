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

describe("init", () => {
	beforeEach(function() {
		console_stub.resetHistory()
		console.error = original_console_error
	})
	it("should start with minimal required options", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: { keys_list: keys, layout }
		})

		expect(console.error.callCount).to.equal(0)
		expect(wrapper.vm.keys).to.not.deep.equal(keys)
		expect(wrapper.vm.keys.length).to.equal(keys.length)
		expect(wrapper.vm.shortcuts.length).to.equal(0)
		expect(wrapper.vm.commands.length).to.equal(0)

		Object.keys(wrapper.vm.keymap).forEach(key => {
			let entry = wrapper.vm.keymap[key]
			for (let property of ["identifier", "character", "classes", "label_classes", "RL", "is_modifier", "block_alone", "block_single", "block_all", "ignore", "nokeydown", "toggle", "fake_toggle", "RL", "active", "chain_active"]) {
				expect(entry[property]).to.not.equal(undefined)
			}
		})
		Object.keys(wrapper.vm.keys).forEach(key => {
			let entry = wrapper.vm.keys[key]
			// note identifier is not included
			for (let property of ["character", "classes", "label_classes", "RL", "is_modifier", "block_alone", "block_single", "block_all", "ignore", "nokeydown", "toggle", "fake_toggle", "RL", "active", "chain_active"]) {
				expect(entry[property]).to.not.equal(undefined)
			}
		})
		expect(wrapper.vm.layout).to.deep.equal(layout)
		expect(wrapper.vm.dev_options).to.deep.equal(defaults.dev_options)
		expect(wrapper.vm.user_options).to.deep.equal(defaults.user_options)
		expect(wrapper.vm.modifiers_order).to.deep.equal(wrapper.vm.modifiers_order.slice().sort())
	})
	it("should throw warnings when missing a required prop", () => {
		console.error = console_stub

		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: { keys_list: keys }
		})

		expect(console.error.callCount).to.equal(1)

		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: { layout }
			})
		}).to.throw()
	})
	it("should throw error when missing modifiers when specifying order_of_modifiers", () => {
		console.error = console_stub
		expect(function(){
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					order_of_modifiers: ["Ctrl"]
				}
			})
		}).to.throw()
	})
	it("should throw error when missing modifiers when specifying empty order_of_modifiers", () => {
		console.error = console_stub
		expect(function(){
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					order_of_modifiers: []
				}
			})
		}).to.throw()
	})
	it("should not throw error when no modifiers and specifying empty order_of_modifiers", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: {},
				layout,
				order_of_modifiers: []
			}
		})
		expect(wrapper.vm.modifiers_order.length).to.equal(0)
	})
	it("should throw error when missing modifiers when specifying incorrectly named order_of_modifiers", () => {
		console.error = console_stub
		expect(function(){
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					order_of_modifiers: ["CtrlRight"]
				}
			})
		}).to.throw()
	})
	it("should throw error if contexts aren't array", () => {
		console.error = console_stub
		expect(function(){
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "a", contexts: "not array" }
					]
				}
			})
		}).to.throw()
	})
	it("should not throw error if contexts is array and should sort and lowercase", () => {
		console.error = console_stub
		expect(function(){
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "a", contexts: ["C", "B", "A"] }
					]
				}
			})
			expect(wrapper.vm.shortcuts[0].contexts).to.deep.equal(["a", "b", "c"])
		}).not.to.throw()
	})
	it("should fill command when shortcut does not have a command", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "a" }
				]
			}
		})
		expect(wrapper.vm.shortcuts[0].command).to.equal("")
	})
	it("should throw when duplicate shortcut", () => {
		console.error = console_stub
		expect(function(){
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "a" },
						{ shortcut: "a" }
					]
				}
			})
		}).to.throw()
	})
	it("should throw error when shortcut is blank", () => {
		console.error = console_stub
		expect(function(){
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "" }
					]
				}
			})
		}).to.throw()
	})
	it("should throw error when shortcut does not contain shortcut", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{}
					]
				}
			})
		}).to.throw()
	})
	it("should throw error when duplicate key identifier", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: {
						La: { identifier: "A" },
						Ra: { identifier: "A" }
					},
					layout
				}
			})
		}).to.throw()
	})
	it("should allow shortcut with single non-modifier", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "a", command: "some command" }
				]
			}
		})
		expect(console.error.callCount).to.equal(0)
	})
	it("should throw error when shortcut has multiple non-modifiers", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "a+b+c" }
					]
				}
			})
		}).to.throw()
	})
	it("should throw error when shortcut contains just multiple modifiers", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+shift+alt" }
					]
				}
			})
		}).to.throw()
	})
	it("should block key if key is block_all", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: {
						a: {
							identifier: "KeyA",
							character: "A",
							block_all: true
						}
					},
					layout,
					shortcuts_list: [
						{ shortcut: "a" }
					]
				}
			})
		}).to.throw()
	})
	it("should block key with modifiers if key is block_all", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: {
						...keys,
						a: {
							identifier: "KeyA",
							character: "A",
							block_all: true
						}
					},
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+a" }
					]
				}
			})
		}).to.throw()
	})
	it("should block key in chain if key is block_all", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: {
						...keys,
						a: {
							identifier: "KeyA",
							character: "A",
							block_all: true
						}
					},
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+b ctrl+a" }
					]
				}
			})
		}).to.throw()
	})
	it("should block shift if block_single", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: {
						shift: {
							identifier: "Shift", // this is an invalid identifier //do not use as example
							character: "Shift",
							block_single: true,
							is_modifier: true
						},
						a: {
							identifier: "KeyA",
							character: "A"
						}
					},
					layout,
					shortcuts_list: [
						{ shortcut: "shift+a" }
					]
				}
			})
		}).to.throw()
	})
	it("should not block shift if not block_single", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: {
					shift: {
						identifier: "Shift", // this is an invalid identifier //do not use as example
						character: "Shift",
						block_single: false,
						is_modifier: true
					},
					a: {
						identifier: "KeyA",
						character: "A"
					}
				},
				layout,
				shortcuts_list: [
					{ shortcut: "shift+a" }
				]
			}
		})
		expect(console.error.callCount).to.equal(0)
	})
	it("should block shift if block_alone and modifier", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: {
						shift: {
							identifier: "Shift", // this is an invalid identifier //do not use as example
							character: "Shift",
							block_alone: true,
							is_modifier: true
						}
					},
					layout,
					shortcuts_list: [
						{ shortcut: "shift" }
					]
				}
			})
		}).to.throw()
	})
	it("should not block shift if not block_alone and modifier", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: {
					shift: {
						identifier: "Shift", // this is an invalid identifier //do not use as example
						character: "Shift",
						block_alone: false,
						is_modifier: true
					}
				},
				layout,
				shortcuts_list: [
					{ shortcut: "shift" }
				]
			}
		})
		expect(console.error.callCount).to.equal(0)
	})
	it("should not block shift if not block_alone and modifier, and it's shortcuts", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: {
					shift: {
						identifier: "Shift", // this is an invalid identifier //do not use as example
						character: "Shift",
						block_alone: false,
						is_modifier: true
					},
					a: {
						identifier: "KeyA",
						character: "A"
					}
				},
				layout,
				shortcuts_list: [
					{ shortcut: "shift" },
					{ shortcut: "shift+a" }
				]
			}
		})
		expect(console.error.callCount).to.equal(0)
	})
	it("should lowercase keyname ", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: {
					SomeKey: {
						name: "A"
					}
				},
				layout
			}
		})
		expect(wrapper.vm.keys.SomeKey.name).to.equal("a")
		expect(console.error.callCount).to.equal(0)
	})
	it("should auto create lowercase keyname if not existent", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: {
					SomeKey: {
						character: "A"
					}
				},
				layout
			}
		})
		expect(wrapper.vm.keys.SomeKey.name).to.equal("a")
		expect(console.error.callCount).to.equal(0)
	})
	it("should auto create chain start", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a a" }
				]
			}
		})
		expect(wrapper.vm.shortcuts.filter(entry => entry.chain_start).length).to.equal(1)
		expect(console.error.callCount).to.equal(0)
	})
	it("should auto create chain starts (w multiple same chained)", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a a" },
					{ shortcut: "ctrl+a b" },
					{ shortcut: "ctrl+a c" },
				]
			}
		})
		expect(wrapper.vm.shortcuts.length).to.equal(4)
		expect(wrapper.vm.shortcuts.filter(entry => entry.chain_start).length).to.equal(1)
		expect(console.error.callCount).to.equal(0)
	})
	it("should auto create chain starts (w multiple different chained)", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a a" },
					{ shortcut: "ctrl+b b" },
					{ shortcut: "ctrl+c c" },
				]
			}
		})
		expect(wrapper.vm.shortcuts.length).to.equal(6)
		expect(wrapper.vm.shortcuts.filter(entry => entry.chain_start).length).to.equal(3)
		expect(console.error.callCount).to.equal(0)
	})
	it("should allow lone custom chain start", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: true }
				]
			}
		})
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(wrapper.vm.shortcuts.filter(entry => entry.command == "Custom Chain Start").length).to.equal(1)
		expect(wrapper.vm.shortcuts.filter(entry => entry.chain_start).length).to.equal(1)
		expect(console.error.callCount).to.equal(0)
	})
	it("should allow custom chain start", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a a" },
					{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: true }
				]
			}
		})
		expect(wrapper.vm.shortcuts.length).to.equal(2)
		expect(wrapper.vm.shortcuts.filter(entry => entry.command == "Custom Chain Start").length).to.equal(1)
		expect(wrapper.vm.shortcuts.filter(entry => entry.chain_start).length).to.equal(1)
		expect(console.error.callCount).to.equal(0)
	})
	it("should allow custom chain start (reversed)", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: true },
					{ shortcut: "ctrl+a a" }
				]
			}
		})
		expect(wrapper.vm.shortcuts.length).to.equal(2)
		expect(wrapper.vm.shortcuts.filter(entry => entry.command == "Custom Chain Start").length).to.equal(1)
		expect(wrapper.vm.shortcuts.filter(entry => entry.chain_start).length).to.equal(1)
		expect(console.error.callCount).to.equal(0)
	})
	it("should allow custom chain start (w multiple shortcuts)", () => {
		console.error = console_stub
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "ctrl+a a" },
					{ shortcut: "ctrl+a b" },
					{ shortcut: "a" },
					{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: true }
				]
			}
		})
		expect(wrapper.vm.shortcuts.length).to.equal(4)
		expect(wrapper.vm.shortcuts.filter(entry => entry.command == "Custom Chain Start").length).to.equal(1)
		expect(wrapper.vm.shortcuts.filter(entry => entry.chain_start).length).to.equal(1)
		expect(console.error.callCount).to.equal(0)
	})
	it("should throw when conflicting chain start", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: true },
						{ shortcut: "ctrl+a", command: "Custom Chain Start" },
						{ shortcut: "ctrl+a a" }
					]
				}
			})
		}).to.throw()
		// reversed
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+a", command: "Custom Chain Start" },
						{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: true },
						{ shortcut: "ctrl+a a" }
					]
				}
			})
		}).to.throw()
	})
	it("should throw when conflicting chain start", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: true },
						{ shortcut: "ctrl+a", command: "Custom Chain Start2", chain_start: true },
						{ shortcut: "ctrl+a a" }
					]
				}
			})
		}).to.throw()
	})
	it("should throw when setting chain start without setting chain_start", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+a", command: "Custom Chain Start" },
						{ shortcut: "ctrl+a a" }
					]
				}
			})
		}).to.throw()
		// reversed
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+a a" },
						{ shortcut: "ctrl+a", command: "Custom Chain Start" }
					]
				}
			})
		}).to.throw()
	})
	it("should throw when setting chain start when setting chain_start false", () => {
		console.error = console_stub
		expect(function() {
			let wrapper = shallowMount(ShortcutVisualizer, {
				propsData: {
					keys_list: keys,
					layout,
					shortcuts_list: [
						{ shortcut: "ctrl+a", command: "Custom Chain Start", chain_start: false },
						{ shortcut: "ctrl+a a" }
					]
				}
			})
		}).to.throw()
	})
})


describe("init-dev", function() {
	it("should change", function() {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "a", command: "initial" }
				]
			}
		})
		wrapper.vm.shortcuts_list = [
			{ shortcut: "a", command: "changed" }
		]
		wrapper.vm.refresh_options(["shortcuts_list"])
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(wrapper.vm.shortcuts[0].command).to.equal("changed")
	})
	it("should do nothing if refresh_options not called", function() {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "a", command: "initial" }
				]
			}
		})
		wrapper.vm.shortcuts_list = [
			{ shortcut: "a", command: "changed" }
		]
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(wrapper.vm.shortcuts[0].command).to.equal("initial")
	})
	it("should do nothing if refresh_options empty", function() {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
				shortcuts_list: [
					{ shortcut: "a", command: "initial" }
				]
			}
		})
		wrapper.vm.shortcuts_list = [
			{ shortcut: "a", command: "changed" }
		]
		wrapper.vm.refresh_options([])
		expect(wrapper.vm.shortcuts.length).to.equal(1)
		expect(wrapper.vm.shortcuts[0].command).to.equal("initial")
	})
	it("should throw if invalid change key", function() {
		let wrapper = shallowMount(ShortcutVisualizer, {
			propsData: {
				keys_list: keys,
				layout,
			}
		})
		expect(function() {
			wrapper.vm.refresh_options(["unknown"])
		}).to.throw()
	})
})