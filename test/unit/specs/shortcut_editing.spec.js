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

describe("shortcut editing", () => {
	beforeEach(function() {
		console_stub.resetHistory()
		console.error = original_console_error
	})
	it("editing", () => {
	})
})