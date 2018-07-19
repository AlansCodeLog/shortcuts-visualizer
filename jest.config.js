const path = require("path")

module.exports = {
	moduleFileExtensions: [
		"js",
		"json", 
		"vue"
	],
	moduleNameMapper: {
		"^@/(.*)$": path.resolve(__dirname, "src/$1")
	},
	transform: {
		"^.+\\.js$": "./node_modules/babel-jest",
		".*\\.(vue)$": "./node_modules/vue-jest"
	},
	testPathIgnorePatterns: [
		"test/e2e"
	],
	testRegex: ".*?(\\.spec\\.|\\.test\\.)js",
	snapshotSerializers: ["./node_modules/jest-serializer-vue"],
	setupFiles: ["./test/unit/setup"],
	mapCoverage: true,
	coverageDirectory: "./test/unit/coverage",
	collectCoverageFrom: [
		"src/**/*.{js,vue}",
		"!src/main.js",
		"!**/node_modules/**"
	]
} 
 