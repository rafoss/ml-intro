const MiniCssExtractPlugin = require(`mini-css-extract-plugin`);

module.exports = {
    target: `web`,
    entry: `./website/src/index.jsx`,
    node: {
        fs: 'empty'
    },
    module: {
        rules: [
            {
                test: /\.(m?js|jsx)$/,
                resolve: {
                    extensions: [`.js`, `.jsx`, `.mjs`]
                },
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: `babel-loader`,
                    options: {
                        presets: [
                            [
                                `@babel/preset-env`,
                                {
                                    corejs: { version: 3, proposals: true },
                                    useBuiltIns: `entry`,
                                    modules: false
                                }
                            ],
                            `@babel/preset-react`
                        ],
                        plugins: [
                            // Order is important
                            [
                                `babel-plugin-transform-imports`,
                                {
                                    '@material-ui/core': {
                                        transform: `@material-ui/core/esm/\${member}`,
                                        preventFullImport: true
                                    },
                                    '@material-ui/icons': {
                                        transform: `@material-ui/icons/esm/\${member}`,
                                        preventFullImport: true,
                                    },
                                    "lodash": {
                                        transform: `lodash/\${member}`,
                                        preventFullImport: true
                                    }
                                }
                            ],
                            [
                                `babel-plugin-import`,
                                {
                                    libraryName: `@material-ui/core`,
                                    libraryDirectory: `esm`,
                                    camel2DashComponentName: false
                                },
                                `core`
                            ],
                            [
                                `babel-plugin-import`,
                                {
                                    libraryName: `@material-ui/icons`,
                                    libraryDirectory: `esm`,
                                    camel2DashComponentName: false
                                },
                                `icons`
                            ],
                            [`@babel/plugin-proposal-class-properties`, { loose: true }],
                            `@babel/plugin-proposal-optional-chaining`,
                        ]
                    }
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    `file-loader`
                ]
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: process.env.NODE_ENV !== `production`,
                        },
                    },
                    { loader: `css-loader`, options: { importLoaders: 1 } },
                    `postcss-loader`,
                    `sass-loader`
                ]
            }
        ]
    }
};
