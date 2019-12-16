const path = require(`path`);
const merge = require(`webpack-merge`);
const webpack = require('webpack');

process.env.NODE_ENV = `development`;
const common = require(`./webpack.common`);

const { HotModuleReplacementPlugin } = require(`webpack`);
const CleanWebpackPlugin = require(`clean-webpack-plugin`);
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require(`html-webpack-plugin`);
const MiniCssExtractPlugin = require(`mini-css-extract-plugin`);

module.exports = merge(common, {
    mode: `development`,
    output: {
        filename: `[name].js`,
        path: path.resolve(__dirname, `dev-build`)
    },
    optimization: {
        usedExports: true
    },
    watch: true,
    watchOptions: {
        ignored: [`/node_modules/`, `/dev-build/`, `/build/`]
    },
    devtool: `inline-source-map`,
    plugins: [
        new webpack.DefinePlugin({
            'process.browser': 'true'
        }),
        new CleanWebpackPlugin([`dev-build`]),
        new CopyWebpackPlugin([
            { from: 'tfmodels/784x100x30x10-bs1000-jpmz/epoch-186', to: 'tfmodel' }
        ]),
        new HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: `website/src/index.html`,
            inject: false,
            showErrors: true
        }),
        new MiniCssExtractPlugin({
            filename: `[name].css`,
            chunkFilename: `[id].css`
        })
    ],
    devServer: {
        hot: true,
        historyApiFallback: true,
        writeToDisk: true,
        host: '0.0.0.0'
    }
});
