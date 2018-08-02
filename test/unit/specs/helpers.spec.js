import { expect } from "chai"

import { exists_entry } from "./helpers.js"

describe("test helper", () => {
	it("should return true when matching exact entry", () => {
		let list = [
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			}
		]
		let entry = {
			string: "string",
			array: ["array1", "array2"],
			bool: true
		}
		expect(exists_entry(list, entry)).to.equal(true)
	})
	it("should return true when matching partials of the entry", () => {
		let list = [
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			}
		]
		let entry = {
			string: "string",
			array: ["array1", "array2"],
			bool: true
		}
		expect(exists_entry(list, { string: entry.string })).to.equal(true)
		expect(exists_entry(list, { array: entry.array })).to.equal(true)
		expect(exists_entry(list, { bool: entry.bool })).to.equal(true)
	})
	it("should return false when arrays not same order", () => {
		let list = [
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			}
		]
		let entry = {
			string: "string",
			array: ["array2", "array1"],
			bool: true
		}
		expect(exists_entry(list, entry)).to.equal(false)
	})
	it("should return false when bool not same", () => {
		let list = [
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			}
		]
		let entry = {
			string: "string",
			array: ["array1", "array2"],
			bool: false
		}
		expect(exists_entry(list, entry)).to.equal(false)
	})
	it("should return false when string not same", () => {
		let list = [
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			}
		]
		let entry = {
			string: "string not same",
			array: ["array1", "array2"],
			bool: true
		}
		expect(exists_entry(list, entry)).to.equal(false)
	})
	it("should return false when undefined", () => {
		let list = [
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			}
		]
		let entry = {
			string: "string not same",
			array: ["array1", "array2"],
			bool: true
		}
		expect(exists_entry([{ ...list[0], string: undefined }], entry)).to.equal(false)
		expect(exists_entry([{ ...list[0], array: undefined }], entry)).to.equal(false)
		expect(exists_entry([{ ...list[0], bool: undefined }], entry)).to.equal(false)
	})
	it("should throw when multiple matches found", () => {
		let list = [
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			},
			{
				string: "string",
				array: ["array1", "array2"],
				bool: true
			}
		]
		let entry = {
			string: "string",
			array: ["array1", "array2"],
			bool: true
		}
		expect(function() {
			exists_entry(list, entry)
		}).to.throw().with.property("message")
	})
})