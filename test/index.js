const Tokenizer   = require('../src/parser/src/tokenize.js').Tokenizer
const Parser      = require('../src/parser/src/parser.js').Parser
require('../src/parser/src/predicates.js')
require('../src/parser/src/parse.js')
const {
  readFileSync: read,
  writeFileSync: write
} = require('fs')
const optimize = require('../src/optimizer/optimize.js')
const generateCode = require('../src/codegen/codeGenerator.js')
const config = require('../src/config.js')
var parserConfig = require('../src/parser/config.js')
const { mergeConfig } = require('../src/parser/src/util.js')

var inFile = process.argv[2]
var noopti = process.argv[3] ? true : false
console.log("Running:", inFile);

var css = read(`test/in/${inFile}`, "utf8")

// for parser, manually merge config, since we dont call parse() fn
parserConfig = mergeConfig(config, parserConfig)
console.log(parserConfig);

var tokenizer =  new Tokenizer(css, parserConfig)
var tokens    =  tokenizer.tokenize()

write("./test/out/tokens.json", JSON.stringify(tokens, null, 2), "utf8")

var parser    =  new Parser(tokens, parserConfig)
var ast       =  parser.parse()

write("./test/out/ast.json", JSON.stringify(ast, null, 2), "utf8")

if (!noopti) {
  var res = optimize(ast, config)
  write("./test/out/optimized_ast.json", JSON.stringify(res.ast, null, 2), "utf8")

  console.log("Mangled names map")
  console.log(JSON.stringify(res.map))
}

var code = generateCode(ast, config)
write("./test/out/final_output.css", code, "utf8")
console.log(parserConfig);
