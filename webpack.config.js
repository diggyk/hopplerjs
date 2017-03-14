'use strict';

var path = require('path');

var webExport = {
    entry: {
        hopplerjs: path.resolve(__dirname, 'src/hopplerjs.ts'),
    },
    output: {
        path: path.resolve(__dirname),
        filename: './dist/[name].js',
        // library: false,
        libraryTarget: 'umd',
    },
    resolve: {
        // root: [path.resolve(__dirname, 'node_modules')],
        // Add `.ts` and `.tsx` as a resolvable extension.
        // extensions: ['.webpack.js', '.ts', '.tsx', '.js'],
        // modules: ['node_modules']
        extensions: ['.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader?tsconfig=tsconfig.json',
            }
        ]
    },
    watch: true,
    watchOptions: {
        aggregateTimeout: 300
    }
};

module.exports = [webExport];
