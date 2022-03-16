const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const assetPath = "assets";

module.exports = {
  entry: "./src/index.tsx",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "HtmlDist"),
    filename: `[name].js`,
    // chunkFilename: "[name].min.js"
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  externals: {
    // react: "React",
    // "react-dom": "ReactDOM",
  },
  stats: {
    children: false,
  },
  module: {
    rules: [
      {
        test: [/\.tsx?$/],
        use: { loader: "awesome-typescript-loader" },
      },
      {
        test: /\.jsx?$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/react"],
          },
        },
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              modules: {
                localIdentName: "[local]_[hash:base64:5]",
              },
            },
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                strictMath: true,
              },
            },
          },
        ],
      },
      {
        test: [/\.(bmp|gif|jpe?g|png|svg|vert|frag)$/],
        use: [
          {
            loader: "file-loader",
            options: {
              name: `${assetPath}/[name].[ext]`,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "Production",
      filename: "index.html",
      template: resolveApp("public/index.html"),
      inject: true,
    }),
  ],
};
