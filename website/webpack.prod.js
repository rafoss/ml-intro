const path = require(`path`);
const merge = require(`webpack-merge`);
const webpack = require('webpack');

process.env.NODE_ENV = `production`;
const common = require(`./webpack.common`);

const CleanWebpackPlugin = require(`clean-webpack-plugin`);
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require(`html-webpack-plugin`);
const TerserPlugin = require(`terser-webpack-plugin`);
const MiniCssExtractPlugin = require(`mini-css-extract-plugin`);
const OptimizeCSSAssetsPlugin = require(`optimize-css-assets-webpack-plugin`);

module.exports = merge(common, {
    mode: `production`,
    output: {
        filename: `[name].[hash].js`,
        path: path.resolve(__dirname, `dist`)
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
        usedExports: true
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.browser': 'true'
        }),
        new CleanWebpackPlugin([`dist`]),
        new CopyWebpackPlugin([
            { from: 'tfmodels/784x100x30x10-bs1000-jpmz/epoch-186', to: 'tfmodel' }
        ]),
        new HtmlWebpackPlugin({
            template: `website/src/index.html`,
            inject: false
        }),
        new MiniCssExtractPlugin({
            filename: `[name].[hash].css`,
            chunkFilename: `[id].[hash].css`
        }),
        new OptimizeCSSAssetsPlugin({})
    ]
});
