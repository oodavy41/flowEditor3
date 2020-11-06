const path = require("path");
const package = require("./package.json");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");

const { data } = package;

const publicPathName = "custom";
const widgetPathName = data.widgetName;

module.exports = {
  entry: "./src/production.ts",
  mode: "production",
  output: {
    publicPath: "./",
    path: path.resolve(__dirname, "dist"),
    filename: `${widgetPathName}/[name].js`,
    libraryTarget: "jsonp",
    library: data.widgetName,
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
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
              name: `${widgetPathName}/assets/img/[name].[hash:8].[ext]`,
              publicPath: publicPathName,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ZipPlugin({
      filename: `${widgetPathName}.zip`,
    }),
  ],
};
