const path = require("path");
const package = require("./package.json");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const { data } = package;

const publicPathName = "custom";
const widgetPathName = data.widgetName;

module.exports = {
  entry: "./src/production.tsx",
  mode: "development",
  output: {
    publicPath: "./",
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    // libraryTarget: "umd",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  optimization: {
    // minimize: true,
    // splitChunks: {
    //   minSize: 30, //提取出的chunk的最小大小
    //   cacheGroups: {
    //     default: {
    //       name: "common",
    //       chunks: "initial",
    //       minChunks: 2, //模块被引用2次以上的才抽离
    //       priority: -20,
    //     },
    //     vendors: {
    //       //拆分第三方库（通过npm|yarn安装的库）
    //       test: /[\\/]node_modules[\\/]/,
    //       name: "vendor",
    //       chunks: "initial",
    //       priority: -10,
    //     },
    //   },
    // },
  },

  externals: [
    {
      react: "React",
      "react-dom": "ReactDOM",
      dagre: "dagre",
    },
    "events",
    "three",
    "three/examples/jsm/postprocessing/EffectComposer.js",
    "three/examples/jsm/postprocessing/RenderPass.js",
    "three/examples/jsm/postprocessing/ShaderPass.js",
    "three/examples/jsm/postprocessing/OutlinePass.js",
    "three/examples/jsm/shaders/FXAAShader.js",
    "three/examples/jsm/loaders/OBJLoader.js",
  ],
  module: {
    noParse: /three|dagre/,
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
    new BundleAnalyzerPlugin({ analyzerPort: 8081 }),
  ],
};
