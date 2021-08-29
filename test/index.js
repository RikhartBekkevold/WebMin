const parse  = require('../src/css-parser/index.js')
const {
  readFileSync: read,
  writeFileSync: write
} = require('fs')
const transformAST = require('../src/transform.js')
const generateCode = require('../src/codeGenerator.js')
const config       = require('../src/config.js')

var css = read("test/in/min_test.css", "utf8")

var ast = parse(css, false, config)
write("./test/out/AST.json", JSON.stringify(ast, null, 2), "utf8") // dont force encoding (for testing its ok), use same as system org file

var modAst = transformAST(ast, config)
write("./test/out/transformedAST.json", JSON.stringify(modAst, null, 2), "utf8")

var code = generateCode(modAst, config)
write("./test/out/final_output.css", code, "utf8")
