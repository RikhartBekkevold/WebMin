const Tokenizer   = require('./src/tokenize').Tokenizer
const Parser      = require('./src/parser').Parser
require('./src/predicates'); // assumed wdir and js?
require('./src/parse');
const { isString, def, removeProp } = require('./src/util');


module.exports = function (input, noLoc, config) { // better than reading global or require inisde the parser file?
  if (!def(input)) return console.warn("Argument not defined");
  if (!isString(input)) return console.warn("Argument must be string");

  var tokenizer =   new Tokenizer(input);
  var tokens    =   tokenizer.tokenize(config.removeComments, config.ignoreFirstComment)

  // this will alsp create this file when we call api fns - which we only wnat to return a string
  require("fs").writeFileSync("./test/out/tokens.json", JSON.stringify(tokens, null, 2), "utf8")

  var parser    =   new Parser(tokens);
  var ast       =   parser.parse(config)

  if (noLoc) removeProp("loc", ast)
  // && config.createSourceMap

  return ast
}
// prop that tell sto remove, vs prop with if around each time we add location data (actually slower?) - tokenize and or parse?
