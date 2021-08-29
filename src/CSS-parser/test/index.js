#!/usr/bin/env node
// print each step to out folder
const parse  = require('../index.js')
// node chaching . should i add this inside fn?
const {
  readFileSync: read,
  writeFileSync: write
} = require('fs')
const transformer = require('../src/transformer.js');
const generateCode = require('../src/codeGenerator.js');

var css     =   read("test.css", "utf8");
// var start   =   new Date().getTime()

// var end     =   new Date().getTime()
// console.log("To parse:", (end-start)/1000)
var ast     =   parse(css)
write("ast.json", JSON.stringify(ast, null, 2), "utf8") // dont force encoding, use same

// ast = parse(css, true)
// write("ast_no_loc.json", JSON.stringify(ast, null, 2), "utf8")
// end = new Date().getTime()
// console.log("To write:", (end-start)/1000)

// need loc for linters?

// try transformer first - transfoemr uses traverser not here - only import transfomer here, then there we have visitors and req the traversr
// write the modified ast - not a new one
var modAst = transformAST(ast) // need to req the traveser in codegenerator too
write("test.min.json", JSON.stringify(modAst, null, 2), "utf8")

// newast or ast - if set cwd. or use abs path it works always. first is pref for othjers too use anywhere too
var code = generateCode(modAst) // need to req the traveser in codegenerator too
write("final.css", code, "utf8")
