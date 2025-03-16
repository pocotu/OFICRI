const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        login: './client/src/pages/auth/login.js',
        mesaPartes: './client/src/pages/mesaPartes/index.js',
        admin: './client/src/pages/admin/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        clean: true,
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'client/public/index.html'),
            filename: 'index.html',
            chunks: ['login']
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'client/public/mesaPartes.html'),
            filename: 'mesaPartes.html',
            chunks: ['mesaPartes']
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'client/public/admin.html'),
            filename: 'admin.html',
            chunks: ['admin']
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { 
                    from: path.resolve(__dirname, 'client/public'),
                    to: ''
                },
                { 
                    from: path.resolve(__dirname, 'client/src/assets'),
                    to: 'assets'
                },
                { 
                    from: path.resolve(__dirname, 'client/src/styles'),
                    to: 'styles'
                }
            ]
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false
                    }
                },
                extractComments: false
            }),
            new CssMinimizerPlugin()
        ],
        splitChunks: {
            chunks: 'all',
            name: 'vendors',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist')
        },
        compress: true,
        port: 3000,
        hot: true,
        historyApiFallback: {
            rewrites: [
                { from: /^\/admin/, to: '/admin.html' },
                { from: /^\/mesaPartes/, to: '/mesaPartes.html' },
                { from: /./, to: '/index.html' }
            ]
        },
        headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        }
    },
    devtool: 'source-map'
}; 