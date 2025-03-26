const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = [
  // core
  {
    mode: "production",
    entry: path.resolve(__dirname, "src", "index.ts"),
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    target: "electron-main",
    resolve: {
      extensions: [".ts", ".js"],
    },
    output: {
      filename: "index.js",
      path: path.resolve(__dirname, "dist"),
      libraryTarget: "commonjs2"
    },
  },

  // preload of navbar
  {
    mode: "production",
    entry: path.resolve(__dirname, "src", "components", "Navbar", "preload.ts"),
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    target: "electron-preload",
    resolve: {
      extensions: [".ts", ".js"],
    },
    output: {
      filename: "preload.js",
      path: path.resolve(__dirname, "dist", "components", "Navbar"),
    },
  },

  // navbar ui
  {
    mode: "production",
    entry: path.resolve(__dirname, "src", "components", "Navbar", "ui", "navbar.ts"),
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        }
      ],
    },
    target: "electron-renderer",
    resolve: {
      extensions: [".ts", ".js"],
    },
    output: {
      filename: "navbar.js",
      path: path.resolve(__dirname, "dist", "components", "Navbar", "ui"),
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "src", "components", "Navbar", "ui", "navbar.html"),
        filename: "navbar.html",
      })
    ]
  }
];
