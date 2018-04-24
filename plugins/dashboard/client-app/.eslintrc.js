module.exports = {
    'extends': 'eslint-config-hapi',
    'parserOptions': {
        'ecmaVersion': 6,
        'ecmaFeatures': {
            'jsx': true
        }
    },
    'env': {
        'browser': true
    },
    'rules': {
        'prefer-arrow-callback': ['off'],
        'dot-notation': ['off'],
        'no-trailing-spaces': ['off'],
        'prefer-const': ['off'],
        'strict': ['off'],
        'semi': ['off'],
		'brace-style': ['off'],
		'object-shorthand': ['off'],
		'arrow-parens': ['off'],
		'no-alert': ['off'],
		'new-parens': ['off'],
		'one-var': ['off'],
        'sort-vars': ['off'],
        'indent': ['off'],
        'hapi/hapi-for-you': ['off'],
    }
}