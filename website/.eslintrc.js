module.exports = {
    parser: "babel-eslint",
    parserOptions: {
        ecmaVersion: 10,
        sourceType: "module",
        ecmaFeatures: {
            globalReturn: true,
            impliedStrict: true,
            jsx: true
        },
        babelOptions: {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        corejs: { version: 3, proposals: true },
                        useBuiltIns: 'usage'
                    }
                ],
                '@babel/preset-react'
            ],
            plugins: [
                ["@babel/plugin-proposal-class-properties", { "loose": true }],
                "@babel/plugin-proposal-optional-chaining"
            ]
        }
    },
    env: {
        browser: true,
        node: true,
        es6: true,
        mongo: true
    },
    plugins: [
        "babel",
        "react",
        "flowtype",
        "eslint-plugin-html"
    ],
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:flowtype/recommended"
    ],
    rules: {
        "array-bracket-spacing": "warn",
        "arrow-spacing": "warn",
        "block-spacing": "warn",
        "comma-spacing": "warn",
        "computed-property-spacing": "warn",
        "func-call-spacing": "warn",
        "generator-star-spacing": "warn",
        "indent": "warn",
        "jsx-quotes": ["error", "prefer-double"],
        "key-spacing": "warn",
        "keyword-spacing": "warn",
        "no-multi-spaces": "warn",
        "new-parens": "warn",
        "no-trailing-spaces": "warn",
        "no-unused-vars": ["warn", {
            "varsIgnorePattern": "^(React$|_)",
            "ignoreRestSiblings": true
        }],
        "no-warning-comments": "warn",
        "no-whitespace-before-property": "warn",
        "object-curly-spacing": ["warn", "always"],
        "rest-spread-spacing": "warn",
        "semi": "warn",
        "semi-spacing": "warn",
        "sort-vars": "warn",
        "sort-imports": ["warn", {
            "ignoreDeclarationSort": true
        }],
        "space-before-blocks": "warn",
        "space-before-function-paren": ["warn", {
            "anonymous": "never",
            "named": "never",
            "asyncArrow": "always"
        }],
        "space-in-parens": "warn",
        "space-infix-ops": "warn",
        "space-unary-ops": "warn",
        "spaced-comment": "warn",
        "switch-colon-spacing": "warn",
        "template-curly-spacing": "warn",
        "template-tag-spacing": "warn",
        "require-atomic-updates": "off",
        "quotes": ["warn", "backtick"],
        "wrap-iife": "warn",
        "yield-star-spacing": "warn",
        "yoda": "warn",
        "react/display-name": "off"
    },
    settings: {
        react: {
            version: "detect"
        }
    },
    globals: {
        logger: "writable"
    }
};
