#!/usr/bin/env node
const util = require('./util.js');
const minify = require('../index.js')
const { writeFileSync, readFileSync } = require('fs')

const arguments = util.getCmdArgs(process.argv)

// if --help present ignore everything else
if (arguments.includes("--help")) {
  return console.log(`
webmin -i files -o file -c file

-i Input files. Can also skip the -i flag.
-o Output file. specific "/dir/file.js" for dir.
-c Path to file containing config js object. Can also make a webmin.config.js file in root directory. -c option has higher prio.`
)
}

var concatString  = util.getInputFiles(arguments)

if (concatString.trim() === "")
  return console.log()

var outputDir = util.getOutputDir(arguments)

var config = util.getConfigObject(arguments)
console.log(concatString);
var min_css = config
  ? minify(concatString, config)
  : minify(concatString)

try {
  writeFileSync(outputDir, min_css.css, "utf8")
} catch (e) {
  console.error("Couldn't write result. No output.");
}
