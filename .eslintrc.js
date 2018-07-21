// https://eslint.org/docs/user-guide/configuring

module.exports = {
	root: true,
	parserOptions: {
		parser: 'babel-eslint'
	},
	env: {
		browser: true,
	},
	// https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
	// consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
	extends: ['plugin:vue/essential'],
	// required to lint *.vue files
	plugins: [
		'vue'
	],
	// add your custom rules here
	rules: {
		// allow debugger during development
		"no-debugger": process.env.NODE_ENV === 'production' ? 'error' : 'off',
		"indent": ["warn", "tab", {"SwitchCase":1}],
		"quotes": [
			"error",
			"double",
			{
				"avoidEscape": true,
				"allowTemplateLiterals": true
			}
		],
		"semi": [
			"error",
			"never"
		],
		"linebreak-style": ["error", "unix"],
		"no-trailing-spaces": ["error"],
		"spaced-comment": ["error", "always"],
		"linebreak-style": ["error", "unix"],
		"brace-style": ["error", "1tbs", { "allowSingleLine": true }],
		"no-lonely-if": "error",
		"curly": "error",
		"no-multiple-empty-lines": ["error", { "max": 2, "maxBOF": 1, "maxEOF":1}],
		"object-curly-spacing": ["error", "always"],
		"array-bracket-spacing": ["error", "never"],
		"computed-property-spacing": ["error", "never"],
		"key-spacing": ["error", { "beforeColon": false, "afterColon" : true}],
		"comma-spacing": ["error", { "before": false, "after": true }],
		// "comma-dangle": ["warn", "never"]
		// "no-unneeded-ternary": ["warn", { "defaultAssignment": false }]
	}
}
