const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const ExtractTextPlugin = require("extract-text-webpack-plugin")
var env = process.env.NODE_ENV

var config = {
   entry: ["./src/index"],
   output: {
      path: path.join(__dirname, "dist"),
      filename: "index.js"
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: [
               {
                  loader: "babel-loader",
                  options: {
                     presets: [
                        ["env", {
                           "targets": { //TODO
                              "browsers": ["last 2 versions", "> 5%"]
                           }
                        }]
                     ],
                     plugins: [
                        //allow use of {...}
                        //https://babeljs.io/docs/plugins/transform-object-rest-spread/
                        "transform-object-rest-spread", 
                        //es6 class properties (named arrow functions, static, etc)
                        //https://babeljs.io/docs/plugins/transform-class-properties/
                        "transform-class-properties"
                     ]
                  }
               },
               {
                  loader: "eslint-loader",
                  options: {
                     fix: true,
                     failOnWarning: false,
                     failOnError: true
                  }
               }
            ]
         },
         {
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
               fallback: [{loader:"style-loader",
                  options: {
                     sourceMap: false
                  }}],
               //resolve-url-loader may be chained before sass-loader if necessary
               use: [
                  {
                     loader: "css-loader",
                     options: {
                        sourceMap: false
                     }
                  },
                  {
                     loader: "sass-loader",
                     options: {
                        sourceMap: false
                     }
                  }
               ]
            })
         }
      ]
   },
   plugins: [
      new webpack.DefinePlugin({
         "process.env": {
            "NODE_ENV": JSON.stringify(process.env.NODE_ENV)
         }
      }),
      new webpack.NamedModulesPlugin(),
      new HtmlWebpackPlugin({
         template: "./src/index.html"
      }),
      new ExtractTextPlugin("styles.css")
   ]
}

//NODE_ENV Specific
if (env == "dev") {
   config.entry = ["./src/example"]
   config.module.rules[0].use[1].options.quiet = true
   config.devtool = false
   config.devServer = {
      contentBase: path.resolve(__dirname, "./src"),
      hot: true,
      // compress:true,
      //open: true,
      openPage: "", 
      inline:true
   }
   config.plugins.push(
      new webpack.HotModuleReplacementPlugin()
   )
} else if (env == "prod" || "prod.min"){
   config.devtool = "source-map"
   config.plugins.push(
      new webpack.optimize.OccurrenceOrderPlugin()
   )
}
if (env == "prod.min") {
   config.output.filename = "index.min.js"
   config.plugins.push(
      new webpack.optimize.UglifyJsPlugin({ minimize: true })
   )
}
if (env == "dev.extract") {
   config.plugins.push(
      new HtmlWebpackPlugin({
         template: "./src/index.html"
      })
   )
}
module.exports = config