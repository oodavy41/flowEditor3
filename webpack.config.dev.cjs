const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const publicPathName = "develop";
const assetPath = "assets";
const outResoucePathName = "js";

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 9011;
const HOST = process.env.HOST || "localhost";

module.exports = {
  entry: "./src/index.tsx",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `${publicPathName}/[name].js`,
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
  devServer: {
    contentBase: "./",
    host: HOST,
    port: DEFAULT_PORT,
    hot: true,
    inline: true, //实时刷新
    compress: true,
    open: true,
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
              name: `${publicPathName}/${assetPath}/[name].[ext]`,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "Development",
      filename: "index.html",
      template: resolveApp("public/index.html"),
      inject: true,
    }),
  ],
};
