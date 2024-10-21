const fs = require('fs')
const minify = require('../index.js')

var css = fs.readFileSync("test/in/current.css", "utf8")
var res = minify(css, {
  prependComment: "/*dasd*/\n",
  optimizeShorthandProperties: false,
  removeComments: true,
  keepFirstComment: false,
  removeCharset: false,
  addLocationData: true
})

console.log("\n");
console.log(res.css)
console.log("\n");
console.log(res.map)
