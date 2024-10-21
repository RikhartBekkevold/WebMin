(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.minify = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var config$1 = {};

	var hasRequiredConfig$1;

	function requireConfig$1 () {
		if (hasRequiredConfig$1) return config$1;
		hasRequiredConfig$1 = 1;
		config$1.internalParserConfig = {
		  removeComments: true,
		  removeSpace: false,
		  addSpecificity: false,
		  addLocationData: false
		};

		// all options exposed to user of minifier
		config$1.defaultConfig = {
		  // prepended either at start of file, or after charset rule. need to include "/**/". prepends always regardless of truthfulness of other comment config
		  prependComment: "",
		  keepFirstComment: false,
		  removeCharset: false,
		  keepImportantInKeyframes: false,


		  removeEmptyAtRules: true,
		  // stylerules containing comments are kept - removes if in media/at rules?
		  removeEmptyStyleRules: true,
		  // if two identical stylerules, removes the last - what if many?
		  mergeIdenticalStyleRules: true, // removeLastIdenticalStyleRule
		  // charset rule ignored in modern css implememtations. we remove misplaced always since invalid.

		  // attempts to shorten a shorthand property (e.g. border, margin) by either re-arranging the values to require less divisional space (border:#fff solid; -> border:solid#fff;), or by removing unecessary values (margin: 20px 20px;  ->  margin: 20px;)
		  optimizeShorthandProperties: true,
		  removeOverridenDeclarations: true,
		  // replace longhand declarations (margin-left) with shorthand wherever possible (margin)
		  // only allow if we know JS does not reference any of the longhand props - only applicable when using CSSOM to ref margin?
		  longhandToShorthand: false,
		  // resolves only those expressions that can be determined by CSS alone
		  resolveExpressions: true,
		  skipTrailingZero: true,
		  removeExcessUnits: true,       // removes px/% etc when val 0
		  useShortestColorValue: true,
		  mangleSelectorNames: false,    // id and class only
		  mangleKeyframeNames: true,
		  mangleNamespaceNames: false,   // mangleNamespacePrefixes
		  mangleVariables: false,
		  resolveVariables: false,       // aka custom properties
		  preMangledNames: {
		    keyframes:  {},
		    selectors:  {},
		    variables:  {},
		    namespaces: {}
		  }
		};
		return config$1;
	}

	var tokenize = {};

	var tokens;
	var hasRequiredTokens;

	function requireTokens () {
		if (hasRequiredTokens) return tokens;
		hasRequiredTokens = 1;
		tokens = {
		  number:             "num",
		  percentage:         "percentage",
		  dimension:          "dimension",
		  comment:            "comment",
		  asterisk:           "asterisk",
		  whitespace:         "whitespace",
		  operator:           "operator",
		  attributeOperator:  "attributeoperator",
		  punctation:         "punctation",
		  class:              "class",
		  id:                 "id",
		  combinator:         "combinator",
		  string:             "string",
		  atRule:             "@",
		  ident:              "ident",
		  url:                "quotelessurl",
		  unknown:            "unknown"
		};
		return tokens;
	}

	var hasRequiredTokenize;

	function requireTokenize () {
		if (hasRequiredTokenize) return tokenize;
		hasRequiredTokenize = 1;
		const tokens = requireTokens();

		tokenize.Tokenizer = class Tokenizer {
		  constructor(input, config) {
		    this.config = config;
		    this.input = input;
		    this.line = 1;
		    this.pos = 0;
		    this.tokens = [];
		    this.curr = 0;
		    this.char = this.input[0];
		    this.firstComment = true;
		  }


		  tokenize() {
		    while(this.curr < this.input.length) {

		      if (this.isWhitespace()) {
		        this.move();
		        this.next();
		        continue
		        // inner check means it will know its whitespace. and will go next in loop. else checks all other
		        // if, and then also adds as delim.

		        // we also need to add whitespace to tree? we dont currently? we dont parse whitesapce ever,
		        // we just make sure parser can handle them, but we dont record

		        // if (this.preserveWhitespace) {
		        // CALLED this.config.removeSpace now?
		          var pos = this.pos, line = this.line;
		      }
		      // when whitespace NOT added. either config. or defult. then
		      // parser messes up next.

		      if (this.isAsterisk()) {
		        this.move();
		        this.createToken(tokens.asterisk, this.char, this.pos);
		        this.next();
		        continue
		      }


		      if (this.isComment()) {
		        var pos = this.pos, line = this.line;
		        let val = "";
		        this.move(2);
		        this.next(2);
		        while (!this.isCommentEnd()) {
		          val += this.char;
		          this.move(), this.next();
		          this.isEnd(line, pos);
		        }

		        if ((this.config.keepFirstComment && this.firstComment) || !this.config.removeComments) {
		          let token = this.createToken(tokens.comment, "/*"+val+"*/", pos);
		          token.line = line;
		          this.firstComment = false;
		        }

		        this.move(2);
		        this.next(2);
		        continue
		      }


		      if (this.isDigitStart()) {
		        var isEpsilon = false;
		        var isInt = true;
		        let num = "", start = this.pos;
		        num += this.char;
		        this.move();
		        this.next();

		        if (this.isDot()) {
		          isInt = false;
		          num += this.char;
		          this.move();
		          this.next();
		        }

		        while (this.isDigit()) {
		          num += this.char;
		          this.move();
		          this.next();

		          if (this.isDot()) {
		            isInt = false;
		            num += this.char, this.move(), this.next();

		            while (this.isDigit()) {
		              num += this.char, this.move(), this.next();

		              if (this.isEpsilon()) {
		                isEpsilon = true;
		                num += this.parseEpsilon();
		              }
		            }
		          }

		          if (this.isEpsilon()) {
		            isEpsilon = true;
		            num += this.parseEpsilon();
		          }
		        }

		        var token = this.createToken(tokens.number, num, start);
		        token.isEpsilon = isEpsilon;
		        token.isInt = isInt;

		        if (this.isIdentStart()) {  // || this.char === "-" && this.peek() === "-" || this.char === "-" && this.isIdentStart(this.peek()) {
		          let val = "";

		          // includes numbers. diff predicate to tokenize 20px20px20px as one value
		          while (this.isIdent()) {
		            val += this.char;
		            this.next(), this.move();
		          }
		          token.type = tokens.dimension;
		          token.unit = val;
		        }
		        else if (this.isPercent()) {
		          token.type = tokens.percentage;
		          this.next(), this.move();
		        }
		        continue
		      }


		      if (this.isOperator() && this.isWhitespace(this.peek())) {
		        var start = this.pos;
		        this.move();
		        this.createToken(tokens.operator, this.char, start);
		        this.next();
		        continue
		      }


		      if (this.isAttributeOperator()) {
		        var start = this.pos;
		        this.move();
		        var token = this.createToken(tokens.attributeOperator, this.char, start);
		        this.next();


		        // make sure becomes universal selector, so correct print fn is called, by not including it here
		        // have | be its own tokenize rx
		        // include | and |* as NamespacePrefixSeparator - makes sure no space, but what about after.. block never adds space.
		        // make a complex in parse step. still need to look for | and |*

		        if (this.isAttributeOperator()) {
		          token.val += this.char;
		          this.move(), this.next();
		        }
		        continue
		      }


		      if (this.isPunctation()) {
		        var start = this.pos;
		        this.move();
		        var token = this.createToken(tokens.punctation, this.char, start);
		        this.next();
		        if (this.char === ":") {
		          token.val += ":";
		          this.move(); this.next();
		        }
		        continue
		      }


		      if (this.isDot() && this.isIdentStart(true)) {
		        let val = "", start = this.pos;
		        this.move();
		        this.next();

		        while (this.isIdent()) {
		          val += this.char;
		          this.move();
		          this.next();
		        }
		        var token = this.createToken(tokens.class, val, start);
		        continue
		      }


		      if (this.isID()) {
		        let name = "", start = this.pos;
		        this.next();
		        this.move();
		        while (this.isIdent()) {
		          name += this.char;
		          this.next(), this.move();
		        }
		        this.createToken(tokens.id, name, start);
		        continue
		      }


		      if (this.isCombinator()) {
		        var start = this.pos;
		        this.move();
		        this.createToken(tokens.combinator, this.char, start);
		        this.next();
		        continue
		      }


		      if (this.isStringStart()) {
		        var delimiter = this.char;
		        var start = this.pos, line = this.line;
		        let val = "";
		        this.move();
		        this.next();
		        while (!this.isStringEnd(delimiter)) {
		          val += this.char;
		          this.move(), this.next();
		          this.isEnd(line, start); // assertEnd
		        }
		        this.move();
		        this.next();

		        let token = this.createToken(tokens.string, val, start);
		        token.delimiter = delimiter;
		        token.line = line;

		        continue
		      }


		      if (this.isAtRule()) {
		        let type = "", start = this.pos;
		        this.move();
		        this.next();
		        while (this.isIdent()) {
		          type += this.char;
		          this.move(), this.next();
		        }
		        this.createToken(tokens.atRule, type, start);
		        continue
		      }


		      if (this.isIdentStart()) { // || this.char === "-" && this.peek() === "-" || this.char === "-" && this.isIdentStart(this.peek()) ) { // exclude *
		        var val = "";
		        var start = this.pos;

		        while (this.isIdent()) { // easy fix to parse as one, so printed witout space
		          val += this.char; // group concat and move?
		          this.move();
		          this.next();
		        }

		        // ws can be inside (, so dont know if "|' is first char
		        // assume url and ( has no space. shl thinks wrong. what about spec?
		        // shl indicates url () wrong, so assume no space
		        if (this.isQuotelessUrl(val)) {
		          var content = "";
		          let start = this.pos;
		          this.move();
		          this.next();

		          // if missing ) loop is endless (like str), untill gets to end - try it
		          // just breaks loop on this.char == undefined? - add isEnd assert?
		          // does create token. but move/next after loop fails?
		          while (this.char !== ")") {
		            content += this.char;
		            this.move();
		            this.next();
		          }

		          // import media
		          this.move();
		          this.next();

		          let token = this.createToken(tokens.url, content, start);
		          token.name = val;

		          continue
		        }

		        this.createToken(tokens.ident, val, start);
		        continue
		      }

		      // if not whitespace && !config.keepWhitespace, parseWhitespace, preserveWhitespace
		      // dont add delim for whitespace
		      // have it go inside so continue..
		      this.move(); // WRONG? seems wrong to move
		      this.createToken(tokens.unknown, this.char, this.pos);
		      this.next();
		    }

		    return this.tokens
		  }

		  parseEpsilon() {
		    var epsilon = "";
		    epsilon += this.char, this.move(), this.next();
		    if (this.isSign()) epsilon += this.char, this.move(), this.next();
		    while (this.isDigit()) epsilon += this.char, this.move(), this.next();
		    return epsilon
		  }

		  isEnd(line, pos) {
		    if (this.curr >= this.input.length) {
		      throw new SyntaxError("Unexpected end of input. Unclosed comment or string starting at line " + line + ":" + pos);
		    }
		  }

		  isStringEnd(type) {
		    return this.char === type && this.lookback() !== "\\"
		  }

		  isStringStart(char) {
		    return char ?
		      char === '"' || char === "'" :
		      this.char === '"' || this.char === "'"
		  }

		  isID() {
		    return this.char === "#"
		  }

		  isDot(char) {
		    return char ? char === "." : this.char === "."
		  }

		  isIdentStart(next) {
		    return next
		        ? /[a-zA-Z_]|\-(?!\d)|[^\x00-\x7F]/.test(this.peek() + this.peek(2)) || (this.peek() === "-" && this.peek(2) === "-") // || escape
		        : /[a-zA-Z_]|\-(?!\d)|[^\x00-\x7F]/.test(this.char + this.peek()) || (this.char === "-" && this.peek() === "-")
		  }

		  isIdent(next) {
		    return /[a-zA-Z0-9_\-]|[^\x00-\x7F]/.test(next ? this.peek() : this.char)
		  }

		  isDigitStart() {
		    return this.isDigit() ||
		      (this.isSign() && (this.isDigit(this.peek()) || this.isDot(this.peek()))) ||
		      (this.isDot() && this.isDigit(this.peek()))
		  }

		  isEpsilon() {
		    return (this.char === "e" || this.char === "E") && (this.isSign(this.peek()) || this.isDigit(this.peek()))
		  }

		  isSign(char) {
		    return "+-".includes(char ? char : this.char)
		  }

		  isDigit(char) {
		    return /[0-9]/.test(char ? char : this.char)
		  }

		  isPercent() {
		    return this.char === "%"
		  }

		  isNewline() {
		    return this.char === "\n" ||
		    this.char === "\r" ||
		    this.char === "\f"
		  }

		  isWhitespace(char) {
		    return /\s/.test(char ? char : this.char)
		  }

		  isQuotelessUrl(val) {
		    return val.toLowerCase() === "url" && this.char === "(" && !this.isStringStart(this.peekFirstNonWhitespaceChar())
		  }

		  isAttributeOperator() {
		    return (
		      this.char === "$" ||
		      this.char === "~" ||
		      this.char === "*" ||
		      this.char === "^" ||
		      this.char === "|" ||
		      this.char === "="
		    )
		  }

		  isAsterisk() {
		    // the *= combo constitutes a attribute operator instead
		    return this.char === "*" && this.peek() !== "="
		  }

		  // - gets picked up by number before isOperator (depending on order in tokenize)
		  isOperator() {
		    return "+-/".indexOf(this.char) !== -1
		  }

		  isAtRule() {
		    return this.char === "@"
		  }

		  isPunctation(char) {
		    return (
		      this.char === "}"  ||
		      this.char === "{"  ||
		      this.char === "["  ||
		      this.char === "]"  ||
		      this.char === "("  ||
		      this.char === ")"  ||
		      this.char === ";"  ||
		      this.char === ":"  ||
		      this.char === "!"  ||
		      this.char === "&"
		    )
		  }

		  isCombinator() {
		    return (
		      this.char === "," || // always separated in parse into ListSeperator.. for all contexts?
		      this.char === ">" ||
		      this.char === "+" ||
		      this.char === "~" // when used two places, always picked up by first if. unless sub if.
		    )
		  }

		  // escape //? \/\* - but dont need esc anything else?
		  isComment() {
		    return this.char + this.peek() === "/*"
		  }

		  isCommentEnd() {
		    return this.char === "*" && this.peek() === "/"
		  }

		  lookback(n) {
		    return n ?
		      this.input[this.curr - n] :
		      this.input[this.curr - 1]
		  }

		  peek(n) {
		    return n ?
		      this.input[this.curr + n] :
		      this.input[this.curr + 1]
		  }

		  // getfirst
		  // firstnonwsisStrStart
		  // causes problems for location depending on preserveWhitespace? no since part of a value? ws is always non-value.
		  peekFirstNonWhitespaceChar() {
		    var n = 1;
		    var char = this.input[this.curr + n];
		    while(this.isWhitespace(char))
		      char = this.input[this.curr + ++n];
		    return this.input[this.curr + n]
		  }

		  next(n, move) {
		    return this.char = n ?
		      this.input[this.curr = this.curr + n] :
		      this.input[++this.curr]
		  }

		  move(n) {
		    if (this.isNewline()) n ? this.line = this.line + n : this.line++;
		    n ? this.pos = this.pos + n : this.pos++;
		    if (this.isNewline()) this.pos = 0;
		  }

		  createToken(type, val, start) {
		    var token = {
		      type: type,
		      val:  val,
		      line: this.line,
		      start: start,
		      end: this.pos
		    };
		    this.tokens.push(token);
		    return token
		  }
		};
		return tokenize;
	}

	var parser$1 = {};

	var hasRequiredParser$1;

	function requireParser$1 () {
		if (hasRequiredParser$1) return parser$1;
		hasRequiredParser$1 = 1;
		parser$1.Parser = class Parser {
		  constructor(tokens, config) {
		    this.config = config;
		    this.tokens = tokens;
		    this.i = 0;
		    this.token = this.tokens[this.i];
		  }

		  // if parse has space, we dont want to skip, because it means we want to preserve
		  // it
		  // tokenize

		  // next itself should check more config in combo with curr tokens?
		  next(n, dontSkipSpace, steps) {
		    this.token = n ?
		    // this.i = this.i + n
		      this.tokens[this.i = this.i + n] : // combine with skip, need to preserve? this why removing easier
		      // not just parse, but also
		      this.tokens[!dontSkipSpace && this.isWhitespace(this.peek()) ? this.i += 2 : ++this.i];
		      // true && next char is whitespace - first, else last
		      // goes 1 ahead, or 2 if next is whitespace. what if multiple whitespace? still visit
		      // never want this fn? becasue if tokenize = no ws, if keep, want to visit? not always, depending on opti/speed.
		      // never call this if this.next()
		  }
		  // add all places we want to parse it/aka we want to ADD TO tree, so any places it can OCCUR
		  // then check if this fn is skiping past and not adding some ws
		  // never more than 1 whitespace in a row! so will always skip all.
		  // "val": "   \r\n\r\n\r\n"

		  // if second arg true. skips whitespace. all whitespace until next token.


		  peek(firstNonSpace) {
		    return firstNonSpace
		      ? this.isWhitespace(this.tokens[this.i + 1]) ? this.tokens[this.i + 2] : this.tokens[this.i + 1]
		      : this.tokens[this.i + 1]
		  }

		  expect(token) {
		    if (this.token === token)
		      throw "Expected " + token + ", instead found" + this.token
		  }

		  // use in every parse loop? or if we find some char not in selector? meaning if goes all way through..
		  isEnd(line, pos) {
		    if (this.i >= this.tokens.length || this.token === undefined) {
		      throw new SyntaxError("Unexpected end of input. Starting at line " + line + ":" + pos) // parse erorr. EOF.
		    }
		  }

		  // pass node type to decide if start and end should both be added - aka atom vs rule
		  createLoc(tokenStart, tokenEnd) { // startLoc
		    // we need end loc for some nodes. need to know when to do it. or always do it.
		    return {
		      start: {
		        line: tokenStart ? tokenStart.loc.start.line : this.token.line,
		        col: tokenStart ? tokenStart.loc.start.col : this.token.start
		      },
		      // add if last arg true - isAtom
		      // if not isAtom we expect to call finish loc to add end
		      // no error if end not added, unless whatver reads loc expects end prop always. can be changed.
		      end: {
		        // we set front as defualt
		        line: tokenEnd ? tokenEnd.line : this.token.line,   // this is just copied start.line, becuase we dont save this info
		        col: tokenEnd ? tokenEnd.end : this.token.end
		      }
		    }
		  }

		  finishLoc() {
		    return {
		      line: this.token.line,
		      col: this.token.end
		    }
		  }

		  // maybeCreateAtomLoc, createCompositeLoc, multilineLoc
		  // atom: single token/single line/direct transfer - start: when diff token than this.token is start token
		  maybeCreateLoc(node, isAtom, startToken) { // startLoc
		    // makes sense for parser to have this config data
		    if (this.config.addLocationData)
		      node.loc.start = {
		        line: startToken ? startToken.loc.start.line : this.token.line,
		        col: startToken ? startToken.loc.start.col : this.token.start
		      };
		    if (isAtom)
		      node.loc.end = {
		        line: this.token.line,
		        col: this.token.end
		      };
		  }
		  // this.updateLoc() - no need to add to a node prop - but need the props to update
		  // finish location. just read again the new values.
		  maybeFinishLoc(node) {
		    if (this.config.addLocationData) {
		      node.loc.end = {
		        line: this.token.line,
		        col: this.token.end
		      };
		    }
		  }

		  // loop selectors, add a number for each node type. the same way., only diff is that we dont do WHEN create node, but when we visit later. running the step itself can be controlled by config flag. can even do it in after parse step to prepare ast
		  // use this kind of map too? for each sel type we loop, we match to map, instead of predefined if?

		  // function maybeAddSpec(spec, type) { // |selectorNode|pattern
		  //   if (this.config.addSpecificity)
		  //     // dont add for complex. add for selector parts.
		  //     var map = {"token.type": 0, }
		  //     // dont add for percentage? its only
		  //     // one of the is fns check multi tokens? checks val too. all of them pretty much.
		  //     var map = {
		  //       // tokens.percentage: 0,
		  //       tokens["id"]: 0,
		  //       tokens.class: 1,
		  //       tokens.ident: 2
		  //       // psudoel
		  //       // psudoclass
		  //       // attribute(operator)
		  //     }
		  //
		  //     spec[map[type]]++
		  //
		  //      // transform?
		  //     spec[map[this.token.type]]++ // might need peek? not good enough for complex? if use correct map str key.
		  //     // need to know what token is
		  //
		  //     // this attaches the prop to node? we pass curr sel down? or set this. state?
		  //     // this.currSelector.specificity
		  // }
		  // module.exports = {
		  //   number: "num",
		  //   percentage: "percentage",
		  //   dimension: "dimension",
		  //   comment: "comment",
		  //   asterisk: "asterisk",
		  //   whitespace: "whitespace",
		  //   operator: "operator",
		  //   attributeOperator: "attributeoperator",
		  //   punctation: "punctation",
		  //   class: "class",
		  //   id: "id",
		  //   combinator: "combinator",
		  //   string: "string",
		  //   atRule: "@",
		  //   ident: "ident",
		  //   url: "quotelessurl",
		  //   delim: "delim"
		  // }


		};
		return parser$1;
	}

	var predicates = {};

	var hasRequiredPredicates;

	function requirePredicates () {
		if (hasRequiredPredicates) return predicates;
		hasRequiredPredicates = 1;
		const pp = requireParser$1().Parser.prototype;
		const { removeCharset, keepImportantInKeyframes }  = requireConfig$1();
		const tokens = requireTokens();

		pp.isDeclarationEnd = function() {
		  return this.token.type === tokens.punctation && this.token.val === ";"
		};

		pp.isBlockStart = function() {
		  return this.token.type === tokens.punctation && this.token.val === "{"
		};

		pp.isBlockEnd = function() {
		  return this.token.type === tokens.punctation && this.token.val === "}"
		};

		pp.isParanStart = function(token) {
		  return token
		    ? token.type === tokens.punctation && token.val === "("
		    : this.token.type === tokens.punctation && this.token.val === "("
		};

		pp.isCondition = function() {
		  return this.isParanStart()
		};

		pp.isParanEnd = function() {
		  return this.token.type === tokens.punctation && this.token.val === ")"
		};

		pp.isNestingSelector = function() {
		  return this.token.type === tokens.punctation && this.token.val === "&"
		};

		pp.isListSeparator = function() {
		  return this.token.type === tokens.combinator && this.token.val === ","
		};

		pp.isAttributeOperator = function() {
		  return this.token.type === tokens.attributeOperator
		};

		pp.isNamespacePrefixSeparator = function() {
		  return this.isAttributeOperator() && (this.token.val === "|" || this.token.val === "|*")
		};

		pp.isID = function(token) {
		  return token ? token.type === tokens.id : this.token.type === tokens.id // this,isIdent
		};

		pp.isTag = function(token) {
		  return token ? token.type === tokens.ident : this.token.type === tokens.ident
		};

		pp.isClass = function(token) {
		  return token ? token.type === tokens.class : this.token.type === tokens.class
		};

		pp.isAttribute = function(token) {
		  return token
		    ? token.type === tokens.punctation && token.val === "["
		    : this.token.type === tokens.punctation && this.token.val === "["
		};

		pp.isPseudoClass = function(token) {
		  return token
		    ? token.type === tokens.punctation && token.val === ":"
		    : this.token.type === tokens.punctation && this.token.val === ":"
		};

		pp.isPseudoElement = function(token) {
		  return token
		    ? token.type === tokens.punctation && token.val === "::"
		    : this.token.type === tokens.punctation && this.token.val === "::"
		};

		pp.isSelector = function(inKeyframe) {
		  return (
		    this.isID()              ||
		    this.isTag()             ||
		    this.isClass()           ||
		    this.isPseudoClass()     ||
		    this.isPseudoElement()   ||
		    this.isAttribute()       ||
		    this.isAsterisk()        ||
		    this.isNestingSelector() ||
		    this.isPercentage() && inKeyframe
		  )
		};

		// make these two preds, into one isComplex pred (isSel && isSel(peek))
		pp.isComplex = function() {
		  // console.log(this.token);
		  // console.log(this.peek());
		  return (
		    this.isTag(this.peek())            ||
		    this.isID(this.peek())             ||
		    this.isClass(this.peek())          ||
		    this.isPseudoClass(this.peek())    ||
		    this.isPseudoElement(this.peek())  ||
		    this.isAttribute(this.peek())
		    // || this.isNestingSelector(this.peek())
		    // parseCombinator?
		  )
		};

		// exlude * that isnt followed by tag - want to see asterisk as universal. but why is specifically if tag after complex?
		// isNonUniversalComplex
		// *body || *body
		pp.isNonAsterisksComplex = function(isKeyframe) {
		  return (this.isSelector(isKeyframe) && this.isComplex()) || (this.isAsterisk() && this.isTag(this.peek()))
		};

		pp.isAsterisk = function(token) {
		  return token ? token.type === tokens.asterisk : this.token.type === tokens.asterisk
		};

		pp.isImportant = function() {
		  return this.token.type === tokens.punctation && this.token.val === "!" // && isIdent(this.peek()) && this.peek().val === "important"
		};

		pp.shouldKeepImportant = function(inKeyframe) {
		  return ((inKeyframe && keepImportantInKeyframes) || !inKeyframe)
		};

		pp.isCombinator = function() {
		  return this.token.type === tokens.combinator
		};

		pp.isIdent = function(token) {
		  return token ? token.type === tokens.ident : this.token.type === tokens.ident
		};

		pp.isDeclarationStart = function() {
		  return this.isIdent()
		};

		pp.isFunction = function(token) {
		  return token ? this.isParanStart(token) : this.isParanStart()
		};

		pp.isUrl = function() {
		  return this.token.type === tokens.url
		};

		pp.isHex = function() {
		  return this.isID()
		};

		pp.isString = function() {
		  return this.token.type === tokens.string
		};

		pp.isOperator = function() {
		  return this.token.type === tokens.operator // || this.isAsterisk(), combinator
		};

		pp.isComment = function() {
		  return this.token.type === tokens.comment
		};

		pp.isWhitespace = function(token) {
		  return token ? token.type === tokens.whitespace : this.token.type === tokens.whitespace
		};

		pp.isNum = function() {
		  return this.token.type === tokens.number
		};

		pp.isPercentage = function() {
		  return this.token.type == tokens.percentage
		};

		pp.isDimension = function() {
		  return this.token.type === tokens.dimension
		};

		pp.isNumericValue = function() {
		  return this.isNum() || this.isDimension() || this.isPercentage()
		};

		pp.isDelim = function() {
		  return this.token.type === tokens.delim
		};

		pp.isMediaQuery = function() {
		  return this.token.type === tokens.atRule && this.token.val === "media"
		};

		pp.isKeyframes = function() {
		  return this.token.type === tokens.atRule && (this.token.val === "keyframes" || this.token.val === "-webkit-keyframes")
		};

		pp.isNamespace = function() {
		  return this.token.type === tokens.atRule && this.token.val === "namespace"
		};

		pp.isImportRule = function() {
		  return this.token.type === tokens.atRule && this.token.val === "import"
		};

		pp.isCharsetRule = function() {
		  return !removeCharset && this.token.type === tokens.atRule && this.token.val === "charset"
		};

		pp.isFontface = function() {
		  return this.token.type === tokens.atRule && this.token.val === "font-face"
		};

		pp.isLayerRule = function () {
		  return this.token.type === tokens.atRule && this.token.val === "layer"
		};
		// dont visually confirm, have test that make sure string is exactly same, with same space etc
		pp.isFontPaletteValues = function () {
		  return this.token.type === tokens.atRule && this.token.val === "font-palette-values"
		};

		pp.isPropertyRule = function () {
		  return this.token.type === tokens.atRule && this.token.val === "property"
		};

		pp.isScopeRule = function () {
		  return this.token.type === tokens.atRule && this.token.val === "scope"
		};

		pp.isColorProfileRule = function () {
		  return this.token.type === tokens.atRule && this.token.val === "color-profile"
		};

		pp.isCounterStyleRule = function () {
		  return this.token.type === tokens.atRule && this.token.val === "counter-style"
		};

		pp.isDocumentRule = function () {
		  return this.token.type === tokens.atRule && this.token.val === "document"
		};

		pp.isViewportRule = function () {
		  return this.token.type === tokens.atRule && this.token.val === "viewport"
		};

		pp.isFontFeatureValues = function() {
		  return this.token.type === tokens.atRule && this.token.val === "font-feature-values"
		};

		pp.isPageRule = function() {
		  return this.token.type === tokens.atRule && this.token.val === "page"
		};

		pp.isContainerRule = function() {
		  return this.token.type === tokens.atRule && this.token.val === "container"
		};

		pp.isSupportsRule = function() {
		  return this.token.type === tokens.atRule && this.token.val === "supports"
		};

		pp.isStartingStyleRule = function() {
		  return this.token.type === tokens.atRule && this.token.val === "starting-style"
		};
		return predicates;
	}

	var parse = {};

	var hasRequiredParse;

	function requireParse () {
		if (hasRequiredParse) return parse;
		hasRequiredParse = 1;
		const pp = requireParser$1().Parser.prototype;

		////////////////////////////////
		pp.parse = function() {
		  var ast = {
		    type: "Stylesheet",
		    rules: []
		  };

		  // isCharsetRule includes config.removeCharset
		  if (this.isCharsetRule()) ast.rules.push(this.parseCharset()), this.next();
		  if (this.config.prependComment !== "") ast.rules.push(this.parseComment(this.config.prependComment));

		  // if config then add instead, go next after
		  // if (this.isWhitespace()) this.next()

		  while (this.token !== undefined) { // for token of this.tokens - this.tokens.forEach
		    var node = this.parseToplevel();
		    if (node) ast.rules.push(node);
		    this.next();
		  }

		  return ast
		};


		////////////////////////////////
		pp.parseToplevel = function(noImp, isKeyframe) {
		  if (this.isSelector(isKeyframe))  return this.parseSelectorList(noImp, isKeyframe)
		  if (this.isComment())             return this.parseComment()
		  if (this.isMediaQuery())          return this.parseMediaList()
		  if (this.isKeyframes())           return this.parseKeyframes()
		  if (this.isFontface())            return this.parseFontface()
		  if (this.isNamespace())           return this.parseNamespaceRule()
		  if (this.isImportRule())          return this.parseImport()
		  if (this.isPageRule())            return this.parsePageRule()
		  if (this.isSupportsRule())        return this.parseSupportsRule()
		  if (this.isFontFeatureValues())   return this.parseFontFeatureValues()
		  if (this.isPropertyRule())        return this.parsePropertyRule()
		  if (this.isColorProfileRule())    return this.parseColorProfileRule()
		  if (this.isDocumentRule())        return this.parseDocumentRule()
		  if (this.isViewportRule())        return this.parseViewportRule()
		  if (this.isCounterStyleRule())    return this.parseCounterStyleRule()
		  if (this.isFontPaletteValues())   return this.parseFontPaletteValuesRule()
		  if (this.isLayerRule())           return this.parseLayerRule()
		  if (this.isScopeRule())           return this.parseScopeRule()
		  if (this.isStartingStyleRule())   return this.parseStartingStyleRule()
		  // if (this.isWhitespace())       return this.parseWhitespace()
		  if (this.isContainerRule())       return this.parseContainerRule()

		  return this.parseUnknown()
		};



		////////////////////////////////
		// STYLERULE
		////////////////////////////////


		////////////////////////////////
		pp.parseSelectorList = function(noImp, isKeyframe) {
		  var node = {
		    type: "StyleRule",
		    selectors: [],
		    rules: {}
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  node.selectors.push(this.parseSelectorPattern(isKeyframe));
		  while (this.isListSeparator()) {
		    this.next();
		    node.selectors.push(this.parseSelectorPattern(isKeyframe));
		  }
		  node.rules = this.parseBlock(noImp);

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseSelectorPattern = function(isKeyframe, context) {
		  var node = {
		    type: "SelectorPattern",
		    selectors: [],
		  };

		  if (this.config.addSpecificity)
		    node.specificity = [
		      0,    // IDs
		      0,    // Classes, attributes and pseudo-classes
		      0     // Elements (tag) and pseudo-elements
		    ];

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  while(!this.isBlockStart() && !this.isListSeparator() && (!this.isParanEnd())) { // || context === "scope"
		    node.selectors.push(this.parseSelector(isKeyframe, node.specificity));
		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseSelector = function(isKeyframe, specificity) {
		  // if (this.isNonAsterisksComplex(isKeyframe)) return this.parseComplex(isKeyframe, specificity)
		  if (this.isNestingSelector())               return this.parseNestingSelector()
		  if (this.isTag())                           return specificity && specificity[2]++, this.parseTag()
		  if (this.isPercentage() && isKeyframe)      return this.parsePercentage()
		  if (this.isAsterisk() && !isKeyframe)       return this.parseUniversal()
		  if (this.isClass() && !isKeyframe)          return specificity && specificity[1]++, this.parseClass()
		  if (this.isID() && !isKeyframe)             return specificity && specificity[0]++, this.parseID()
		  if (this.isCombinator() && !isKeyframe)     return this.parseCombinator()
		  if (this.isPseudoElement() && !isKeyframe)  return specificity && specificity[2]++, this.parsePseudoElement()
		  if (this.isPseudoClass() && !isKeyframe)    return specificity && specificity[1]++, this.parsePseudoClass()
		  if (this.isAttribute() && !isKeyframe)      return specificity && specificity[1]++, this.parseAttribute()
		  if (this.isNamespacePrefixSeparator())      return this.parseNamespacePrefixSeparator()
		  if (this.isComment())                       return this.parseComment()
		  return this.parseUnknown()
		};


		////////////////////////////////
		// parse a (compound) selector that has several selectors as a part of it. e,g, body.dark
		pp.parseComplex = function(isKeyframe, specificity) {
		  var node = {
		    type: "ComplexSelector",
		    selectors: []
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  if (this.isTag())
		    node.selectors.push(this.parseTag()), specificity && specificity[2]++, this.next(null, true);
		  else if (this.isAsterisk())
		    node.selectors.push(this.parseUniversal()), this.next(null, true);
		    if (this.isTag())
		      node.selectors.push(this.parseTag()), specificity && specificity[2]++, this.next(null, true);

		  while(!this.isWhitespace() && !this.isBlockStart() && !this.isListSeparator() && !this.isCombinator()) {
		    if (this.isClass() && !isKeyframe)               node.selectors.push(this.parseClass()), specificity && specificity[1]++;
		    else if (this.isTag())  /*&& !isKeyframe? */     node.selectors.push(this.parseTag()), specificity && specificity[2]++;
		    else if (this.isID() && !isKeyframe)             node.selectors.push(this.parseID()), specificity && specificity[0]++;
		    else if (this.isPseudoElement() && !isKeyframe)  node.selectors.push(this.parsePseudoElement()), specificity && specificity[2]++;
		    else if (this.isPseudoClass() && !isKeyframe)    node.selectors.push(this.parsePseudoClass()), specificity && specificity[1]++;
		    else if (this.isAttribute() && !isKeyframe)      node.selectors.push(this.parseAttribute()), specificity && specificity[1]++;
		    else if (this.isComment())                       node.selectors.push(this.parseComment());
		    else this.parseUnknown();
		    this.next(null, true);
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseBlock = function(noImp) {
		  var node = {
		    type: "Block",
		    declarations: []
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  while (!this.isBlockEnd()) {
		    if (this.isComment()) node.declarations.push(this.parseComment());
		    else if (this.isDeclarationStart()) node.declarations.push(this.parseDeclaration(noImp));
		    else if (this.isStartingStyleRule()) node.declarations.push(this.parseStartingStyleRule(true));

		    // can parse infinitely nested stylerules, but only & can trigger
		    // allow & only to parse nested stylerules
		    else if (this.isNestingSelector())  node.declarations.push(this.parseSelectorList());

		    else this.parseUnknown();
		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseDeclaration = function(noImp) {
		  var node = {
		    type: "Declaration",
		    important: false,
		    property: "",
		    value: {}
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  // if correct val, add, else add unknown?
		  node.property = this.token.val;
		  this.next(2);

		  node.value = this.parseValues(node, noImp);

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};



		////////////////////////////////
		pp.parseValues = function(parent, noImp) {
		  var node = {
		    type: "Value",
		    parts: []
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  while (!this.isDeclarationEnd()) { // isEnd here too? or have push trash at end. then end up in tree. unknown.
		    if (this.isComment())            node.parts.push(this.parseComment());
		    // "DeclarationValueSeparator" aka isListSeparator
		    else if (this.isListSeparator()) node.parts.push(this.parseListSeparator());
		    else if (this.isOperator())      node.parts.push(this.parseOperator());
		    else if (this.isNum())           node.parts.push(this.parseNum());
		    else if (this.isPercentage())    node.parts.push(this.parsePercentage());
		    else if (this.isDimension())     node.parts.push(this.parseDimension());
		    else if (this.isUrl())           node.parts.push(this.parseQuotelessString());
		    else if (this.isFunction())      node.parts.push(this.parseFunction(node.parts.pop()));
		    else if (this.isString())        node.parts.push(this.parseString());
		    else if (this.isHex())           node.parts.push(this.parseHex());
		    else if (this.isIdent())         node.parts.push(this.parseIdent());
		    else                             node.parts.push(this.parseUnknown());

		    if (this.isImportant())        { parent.important = true; this.next(); }

		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		// SELECTORS
		////////////////////////////////


		////////////////////////////////
		pp.parsePseudoElement = function() {
		  let node = {
		    type: "PsuedoElementSelector",
		    name: ""
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.name = this.token.val;
		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }
		  return node
		};


		////////////////////////////////
		pp.parsePseudoClass = function() {
		  let node = {
		    type: "PseudoClassSelector",
		    name: ""
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.name = this.token.val;
		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }
		  return node
		};


		////////////////////////////////
		pp.parseAttribute = function() {
		  let node = {
		    type: "AttributeSelector",
		    name: "",
		    operator: null,
		    value: null,
		    flag: null
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.name = this.maybeParseIdent();
		  this.next();
		  if (this.isAttributeOperator()) {
		    node.operator = this.token.val;
		    this.next();
		    node.value = this.maybeParseString();
		    this.next();
		    if (this.isIdent()) node.flag = this.parseIdent(), this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseClass = function() {
		  var node = {
		    type: "ClassSelector",
		    name: this.token.val
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  return node
		};


		////////////////////////////////
		pp.parseTag = function() {
		  var node = {
		    type: "TagSelector",
		    name: this.token.val
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  return node
		};


		////////////////////////////////
		pp.parseID = function() {
		  var node = {
		    type: "IdSelector",
		    name: this.token.val,
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseUniversal = function(isKeyframe, context) {
		  var node = {
		    type: "UniversalSelector",
		    name: this.token.val
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseCombinator = function() {
		  var node = {
		    type: "Combinator",
		    name: this.token.val
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseListSeparator = function(token) {
		  var node = {
		    type: "ListSeparator",
		    val: ","
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		// "(" trigger parseFunction. it then uses the prev ident as name,
		// and removes previously parsed/pushed ident.
		// change to ident + "(" combo triggering isFunction?
		pp.parseFunction = function(token) {
		  var node = {
		    type: "Function",
		    name: token.name,
		    arguments: []
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  while (!this.isParanEnd()) {
		    if (this.isListSeparator()) node.arguments.push(this.parseListSeparator());
		    else if (this.isAsterisk() || this.isDelim())
		      node.arguments.push(this.parseOperator());
		    else if (this.isFunction())
		      node.arguments.push(this.parseFunction(node.arguments.pop()));
		    else // isAtom
		      node.arguments.push(this.parseAtom());
		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		// ATOMS
		////////////////////////////////


		////////////////////////////////
		pp.parseNum  = function() {
		  var node = {
		    type: "Number",
		    val: this.token.val,
		    isInt: this.token.isInt,
		    isEpsilon: this.token.isEpsilon
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parsePercentage  = function() {
		  var node = {
		    type: "Percentage",
		    val: this.token.val,
		    isInt: this.token.isInt,
		    isEpsilon: this.token.isEpsilon
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseDimension  = function() {
		  var node = {
		    type: "Dimension",
		    val: this.token.val,
		    unit: this.token.unit,
		    isInt: this.token.isInt,
		    isEpsilon: this.token.isEpsilon
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseHex = function() {
		  var node = {
		    type: "Hex",
		    val: this.token.val
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseIdent = function() {
		  var node = {
		    type: "Identifier",
		    name: this.token.val
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.maybeParseIdent = function() {
		  return this.isIdent()
		  ? this.parseIdent()
		  : this.parseUnknown()
		};


		////////////////////////////////
		pp.parseString = function() {
		  var node = {
		    type: "String",
		    val: this.token.val,
		    delimiter: this.token.delimiter
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.maybeParseString = function() {
		  return this.isString()
		  ? this.parseString()
		  : this.parseUnknown()
		};


		////////////////////////////////
		// strictly: url(path without quotes)
		pp.parseQuotelessString = function(isKeyframe, context) {
		  var node = {
		    type: "QuotelessUrl",
		    val: this.token.val,
		    name: this.token.name
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};

		////////////////////////////////
		pp.parseOperator = function(val) {
		  var node = {
		    type: "Operator",
		    val: val || this.token.val
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseUnknown = function() {
		  var node = {
		    type: "Unknown",
		    token: this.token
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseNamespacePrefixSeparator = function() {
		  var node = {
		    type: "NamespacePrefixSeparator",
		    val: this.token.val // can be both "|" or "|*", save for codegen
		    // name: "" // svg
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  return node
		};


		////////////////////////////////
		pp.parseAtom = function() {
		  if (this.isNum())        return this.parseNum()
		  if (this.isPercentage()) return this.parsePercentage()
		  if (this.isDimension())  return this.parseDimension()
		  if (this.isIdent())      return this.parseIdent()
		  if (this.isString())     return this.parseString()
		  if (this.isHex())        return this.parseHex()
		  if (this.isOperator())   return this.parseOperator()
		  return this.parseUnknown()
		};


		////////////////////////////////
		pp.parseComment = function (text) {
		  var node = {
		    type: "Comment",
		    val: text ? text : this.token.val
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		////////////////////////////////
		pp.parseWhitespace = function() {
		  var node = {
		    type: "Whitespace",
		    val: this.token.val   // \n \s etc, can be "\n\r\n\r\s"
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};


		/////////////////////////////////
		// AT RULES
		/////////////////////////////////


		////////////////////////////////
		pp.parseNamespaceRule = function () {
		  var node = {
		    type: "NamespaceRule",
		    prefix: null,
		    url: null
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();

		  if (this.isIdent() && this.token.val.toLowerCase() !== "url") {
		    node.prefix = this.parseIdent();
		    this.next();
		  }

		  if (this.isString()) {
		    node.url = this.parseString();
		  }
		  else if (this.isUrl()) {
		    node.url = this.parseQuotelessString(); // parseQuotlessStringUrlFunction or parseUrl
		  }
		  else {
		    // we assume we at ident and that its "url|URL" and fn
		    let tempNode = this.parseIdent(); //{//} this.maybeParseIdent()
		    this.next();
		    node.url = this.parseFunction(tempNode);
		  }
		  console.log(this.token);
		  this.next();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parsePageRule = function () {
		  var node = {
		    type: "PageRule",
		    styleRule: {}
		  };
		  this.next();
		  node.styleRule = this.parseSelectorList(); // a whitelist, spec only allows PseudoClassSelector and indent
		  return node
		};



		////////////////////////////////
		pp.parseSupportsRule = function() {
		  var node = this.parseMediaList();
		  node.type = "SupportsRule";
		  return node
		};


		////////////////////////////////
		pp.parseFontPaletteValuesRule = function() {
		  var node = {
		    type: "FontPaletteValuesRule",
		    name: (this.next(), this.maybeParseIdent()),
		    rules: {}
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.rules = this.parseBlock();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseFontface = function() {
		  var node = {
		    type: "FontFaceRule",
		    rules: {} // declarations?
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.rules = this.parseBlock();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};

		// variable number of names, block
		// @layer layer-name {rules}
		// @layer layer-name;
		// @layer layer-name, layer-name, layer-name;
		// @layer {rules}
		pp.parseLayerRule = function() {
		  var node = {
		    type: "LayerRule",
		    names: [],
		    rules: []
		  };

		  // if in createLoc, same thing. same class reads the config. but only one fn. instead of many
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  while (!this.isBlockStart() && !this.isDeclarationEnd()) { // while this.isIdent() - wont end if neither encountered
		    if (this.isIdent()) node.names.push(this.parseIdent()); // while not a chars vs while is
		    // veryfi that always every second? peek?
		    else if (this.isListSeparator()) node.names.push(this.parseListSeparator());
		    this.next();
		  }

		  // if ; fast path? also must go next if ;? outside should - caller

		  if (this.isBlockStart()) {
		    // preserves @layer state {} - replace with block node - or remove empty layer rule
		    node.hasEmptyBlock = true;

		    this.next();
		    while (!this.isBlockEnd()) {
		      node.rules.push(this.parseSelectorList()); // ends on }
		      this.next();
		    }
		  }

		  // two atrule keywords cant be on the same line????
		  // seems anything after layer module; will seem invalid by the shl.
		  // use parseSelectorList for keyframe too? works with inKeyframe arg?
		      // entire stylerule/rule, and call fn to loop untill a char, consumeWitoutAddingNode("char"|pred)
		  // else if ;

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseFontFeatureValues = function() {
		  var node = {
		    type: "FontFeatureValuesRule",
		    // loc: this.createLoc(),
		    familyNames: [],
		    features: {
		      type: "Block",
		      // loc: this.createLoc(), // create after first loop
		      declarations: []
		    }
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();

		  while (!this.isBlockStart()) {
		    if (this.isString()) node.familyNames.push(this.parseString());
		    else if (this.isIdent()) node.familyNames.push(this.parseIdent());
		    else if (this.isListSeparator()) node.familyNames.push(this.parseListSeparator()); // just add it for printing, we dont need to group?
		    else this.parseUnknown();
		    this.next();
		  }

		  // move below first loop?
		  if (this.config.addLocationData)
		    node.features.loc = this.createLoc();

		  this.next();

		  while (!this.isBlockEnd()) {
		    let tempNode = { type: "Feature", name: this.token.val, declarations: {} };
		    this.next();
		    tempNode.declarations = this.parseBlock(); // change to loop that: idnet: parseNumber; - now whitelist - its just as easy almost
		    node.features.declarations.push(tempNode);
		    this.next();
		    // add loc data for tempNode!
		  }
		  // should be +1 between these
		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  // block ends where last declaration ends
		  if (this.config.addLocationData) {
		    node.features.loc.end = this.finishLoc();
		  }
		  return node
		};


		////////////////////////////////
		pp.parsePropertyRule = function () {
		  var node = {
		    type: "PropertyRule",
		    name: "",
		    rules: {}
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.name = this.maybeParseIdent();
		  this.next();
		  node.rules = this.parseBlock();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseColorProfileRule = function () {
		  var node = {
		    type: "ColorProfileRule",
		    name: "",
		    rules: {} // huge whitelist
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.name = this.maybeParseIdent();
		  this.next();
		  node.rules = this.parseBlock();

		  if (this.config.addLocationData)
		    node.loc.end = this.finishLoc();

		  return node
		};


		////////////////////////////////
		pp.parseCounterStyleRule = function () {
		  var node = {
		    type: "CounterStyleRule",
		    name: "",
		    declarations: {}  // huge whitelist
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.name = this.maybeParseIdent();

		  this.next();
		  node.declarations = this.parseBlock();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		// huge whitelist
		pp.parseViewportRule = function () {
		  var node = {
		    type: "ViewportRule",
		    declarations: {} // call rules?
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.declarations = this.parseBlock();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		// DEPRECATED - parse if run in browsers that understnads it. recommned to remove. config flag?
		pp.parseDocumentRule = function () {
		  var node = {
		    type: "DocumentRule",
		    functions: [],
		    selectors: {
		      type: "Block",
		      // loc: this.createLoc(), // create after first loop
		      declarations: []         // declarations imply declarations, but we here use them for stylerules as the declarations
		    }
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next(); // to either { or first ident/fn name

		  while (!this.isBlockStart()) {

		    if (this.isIdent()) {
		      var temp = this.parseIdent();
		      this.next();
		      if (this.isFunction()) node.functions.push(this.parseFunction(temp));

		      // after parsing a function, we move past ")" and continue.
		      // we continue because if we dont, next "if" only checks for list, then goes next.
		      // if next was another ident/fn however, it will skip past it because of the this.next after the if.
		      this.next();
		      continue
		    }
		    if (this.isUrl()) node.functions.push(this.parseQuotelessString());
		    if (this.isListSeparator()) node.functions.push(this.parseListSeparator());

		    this.next();
		  }

		  this.next();   // parseSelectorList expects first token to be first selector not { so we must call next

		  while (!this.isBlockEnd()) {
		    // parseSelectorList return StyleRule obj with declaraiton prop, so shouldnt push?
		    // parseToplevel seems to work for parseKeyframes
		    // wont add {} since we dont parseBlock - selectorlist wont add before
		    // should add for rule manually in printer, since its wrapping around the document
		    // problem for ast users? create tempNode block here? so printer can
		    node.selectors.declarations.push(this.parseSelectorList());
		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseScopeRule = function() {
		  var node = {
		    type: "ScopeRule",
		    // list, scopelist, media features, patterns, selectorPattenrs
		    scopes: [], // prelude section // isnt only selectors. printer stop assuming parent of class has selectors arr
		    rules: []
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  // include ( as selector end? else parseSelector never ends - orParseMediaFeature? make parseSelector its own fn, sep from while loop, so can call elsewhere too
		  this.next();
		  if (this.isParanStart()) {
		    this.next();
		    // scopes, prelude - root limit
		    //|sellist|selectors - fromScope, toScope
		    node.scopes.push(this.parseScopePrelude());
		    this.next();
		  }

		  if (this.isIdent()) {
		    node.scopes.push(this.parseIdent()); // in this context make it a special type? so can have print visitor instead of print context preds
		    this.next();
		  }

		  if (this.isParanStart()) {
		    this.next();
		    node.scopes.push(this.parseScopePrelude());
		    this.next();
		  }

		  if (this.isBlockStart()) {
		    this.next();
		    while (!this.isBlockEnd()) {
		      node.rules.push(this.parseSelectorList()); // ends on }
		      this.next();
		    }
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseScopePrelude = function() {
		  var node = {
		    type: "Scope",
		    selectors: []
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  node.selectors.push(this.parseSelectorPattern());
		  while (this.isListSeparator()) {
		    this.next();
		    node.selectors.push(this.parseSelectorPattern()); // parses untill , or { or )
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseStartingStyleRule = function(nested) {
		  var node = {
		    type: "StartingStyleRule",
		    rules: []
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();

		  if (this.isBlockStart()) {
		    if (nested) {
		      // rules: [ { type: 'Block', declarations: [Array] } ]
		      node.rules.push(this.parseBlock());
		    }
		    else {
		      this.next();
		      while (!this.isBlockEnd()) {
		        node.rules.push(this.parseSelectorList()); // ends on }
		        this.next();
		      }
		    }
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};



		////////////////////////////////
		pp.parseImport = function() {
		  var node = {
		    type: "ImportRule",
		    url: "",
		    media: null // not always being [] causes problems in printer?
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();

		  var fnNameNode = this.maybeParseIdent(); // all tokens have val, so its ok
		  // can comment be after url too? and inside url/fn?
		  if (this.isComment()) node.parts.push(this.parseComment()), this.next(); // node.comments. can printer print?
		  node.url = this.isString() ?
		                this.parseString() :
		                this.isUrl() ?
		                  this.parseQuotelessString() :
		                  (this.next(), this.parseFunction(fnNameNode));
		  this.next();

		  // MEDIA stuff
		  // related to punc? doesnt know )
		  // if invalid css, errs. if not ; after ) - pushes null node, so traverser cant read type
		  // looks like generic parsing of more specific import syntax
		  if (!this.isDeclarationEnd()) {
		    node.media = [];
		    while (!this.isDeclarationEnd()) {
		      if (this.isParanStart()) {
		        var declaration = {
		          type: "Declaration",
		          loc: this.createLoc(),
		          prop: "",
		          val: {}
		        };
		        this.next();
		        declaration.prop = this.token.val;
		        // can be sapce, but since in loop?!!
		        this.next(2); // wrong too? spacing issue? comment?
		        declaration.val = this.parseValues();
		        node.media.push(declaration);
		        node.loc.end.line = this.token.line;
		        node.loc.end.col = this.token.end;
		      }
		      else {
		        // pushes undefined if nothing.
		        node.media.push(this.parseAtom()); // else parseTrash? then node that can be read and reproduced
		        // else need to detect all valid types here, and have else throw?. instead of looking for end.
		        // what if end never comes?
		        this.next();
		      }
		    }
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }
		  return node
		};


		////////////////////////////////
		// charset only allowed at first line/col. and it is only legal with " and not '
		pp.parseCharset = function() {
		  var node = {
		    type: "CharsetRule",
		    encoding: "",
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.encoding = this.maybeParseString();
		  this.next();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};



		////////////////////////////////
		pp.parseKeyframes = function() {
		  var node = {
		    type: "KeyframesRule",
		    name: "",
		    arguments: []
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.name = this.maybeParseIdent();
		  this.next();
		  this.next();
		  while (!this.isBlockEnd()) {
		    // parseSelectorList IS THE CORRECT THING TO DO!
		    node.arguments.push(this.parseToplevel(true, true));
		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};

		////////////////////////////////
		// MEDIA
		////////////////////////////////

		////////////////////////////////
		pp.parseMediaList = function() {
		  var node = {
		    type: "MediaQueryList",
		    queries: [],
		    selectors: []
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.queries.push(this.parseMedia());
		  while (this.isListSeparator()) {
		    this.next();
		    node.queries.push(this.parseMedia());
		  }
		  this.next();
		  while (!this.isBlockEnd()) {
		    var tempnode = this.parseToplevel();
		    if (tempnode) node.selectors.push(tempnode);
		    this.next();
		  }
		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }
		  return node
		};


		////////////////////////////////
		pp.parseMedia = function() {
		  var node = {
		    type: "MediaRule",
		    def: []
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  while(!this.isBlockStart() && !this.isListSeparator()) {
		    node.def.push(this.parseAtom() || this.parseMediaFeature());
		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }
		  return node
		};


		////////////////////////////////
		pp.parseMediaFeature = function() {
		  var node = {
		    type: "MediaFeature",
		    prop: null,
		    val: null
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.prop = this.maybeParseIdent();
		  // this.next(2) TypeError: Cannot read property 'type' of undefined
		  this.next();
		  this.next();
		  node.val = this.parseAtom();
		  this.next();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};



		////////////////////////////////
		pp.parseContainerRule = function() {
		  var node = {
		    type: "ContainerRule",
		    conditions: [],
		    rules: null
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();

		  while (this.isCondition() || this.isIdent()) {
		    // ident can be container-name or to|and|or
		    if (this.isIdent()) node.conditions.push(this.parseIdent());
		    else node.conditions.push(this.parseContainerCondition());
		    this.next();
		  }

		  this.next();
		  node.rules = {type: "Block", declarations: []};

		  while (!this.isBlockEnd()) {
		    node.rules.declarations.push(this.parseToplevel());
		    this.next();
		  }

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseContainerCondition = function() {
		  var node = {
		    type: "ContainerCondition",
		    prop: null,
		    operator: null,
		    val: null
		  };

		  if (this.config.addLocationData)
		    node.loc = this.createLoc();

		  this.next();
		  node.prop = this.maybeParseIdent();
		  this.next();
		  node.operator = this.isCombinator() ? this.parseCombinator() : this.parseOperator();

		  this.next();
		  node.val = this.parseAtom();
		  this.next();

		  if (this.config.addLocationData) {
		    node.loc.end = this.finishLoc();
		  }

		  return node
		};


		////////////////////////////////
		pp.parseNestingSelector = function() {
		  var node = {
		    type: "NestingSelector"
		  };
		  if (this.config.addLocationData)
		    node.loc = this.createLoc();
		  return node
		};
		return parse;
	}

	var util$1;
	var hasRequiredUtil$1;

	function requireUtil$1 () {
		if (hasRequiredUtil$1) return util$1;
		hasRequiredUtil$1 = 1;
		function defined(val) {
		  return val !== undefined && val !== null
		}

		function isString(val) {
		  return typeof val === "string"
		}

		function isEmpty(str) {
		  return str.trim().length === 0
		}

		/**
		 * Assign source object's properties to target.
		 * If target already has properties. Updates the value.
		 */
		function assignOverlap(source, target) {
		  Object.keys(target).forEach(function(key) {
		    target[key] = source[key] || target[key];
		  });
		  return target
		}

		/**
		 * Merge two config objects, if either
		 * not provided, prevent error.
		 */
		function mergeConfig(user, _default) {
		  return assignOverlap(user || {}, _default || {})
		}

		util$1 = {
		  defined,
		  isString,
		  isEmpty,
		  assignOverlap,
		  mergeConfig
		};
		return util$1;
	}

	var config;
	var hasRequiredConfig;

	function requireConfig () {
		if (hasRequiredConfig) return config;
		hasRequiredConfig = 1;
		config = {
		  // tokenize
		  keepFirstComment: false,
		  removeComments: true,
		  removeSpace: true,

		  // parse
		  prependComment: "",
		  addSpecificity: true,
		  addLocationData: false,

		  // predicates
		  removeCharset: false,
		  keepImportantInKeyframes: false
		};
		return config;
	}

	var parser;
	var hasRequiredParser;

	function requireParser () {
		if (hasRequiredParser) return parser;
		hasRequiredParser = 1;
		const Tokenizer   = requireTokenize().Tokenizer;
		const Parser      = requireParser$1().Parser;
		requirePredicates();
		requireParse();
		const { isString, defined, isEmpty, mergeConfig } = requireUtil$1();
		var config = requireConfig();

		parser = function (input, userConfig) {
		  if (!defined(input))  throw new Error("Input not defined")
		  if (!isString(input)) throw new Error("Input must be string")
		  if (isEmpty(input))   throw new Error("Input file/string is empty")


		  Object.assign(config, userConfig);
		  // can read org required? mutated? but we pass, so copy..
		  // console.log(userConfig);
		  // config = mergeConfig(userConfig, config)
		  // config = mergeConfig(config, userConfig)
		  // makes more sense to be passed the correct config, instead of filter? min should filter user add and min added?
		  console.log("final parser config:", config);

		  const tokenizer =   new Tokenizer(input, config);
		  const tokens    =   tokenizer.tokenize();
		  const parser    =   new Parser(tokens, config);
		  const ast       =   parser.parse();

		  return ast
		};
		return parser;
	}

	var traverse;
	var hasRequiredTraverse;

	function requireTraverse () {
		if (hasRequiredTraverse) return traverse;
		hasRequiredTraverse = 1;
		function traverseParent(ast, visitors) {
		  var visitedSelectorPatterns = [];
		  var ancestors = [];

		  traverse(ast, null);
		  function traverse(node, parent, idx, arr, parentArr) {
		    ancestors.push(node);

		    if (visitors && visitors[node.type] && visitors[node.type].enter) {
		      var hasRemoved = visitors[node.type].enter(node, parent, idx, visitedSelectorPatterns, arr, parentArr, ancestors);
		      if (hasRemoved === true)
		        return ancestors.pop(node), hasRemoved
		    }

		    if (traversers[node.type])
		      var action = traversers[node.type](node, traverse, arr);

		    if (visitors && visitors[node.type] && visitors[node.type].exit) {
		      var hasRemoved = visitors[node.type].exit(node, parent, idx, visitedSelectorPatterns, arr, parentArr, ancestors);

		      if (node.type === "StyleRule" && action && hasRemoved === true)
		        return ancestors.pop(node), action + 1
		      if (node.type === "StyleRule" && action)
		        return ancestors.pop(node), action
		      if (hasRemoved === true)
		        return ancestors.pop(node), hasRemoved
		    }

		    if (node.type === "SelectorPattern" && hasRemoved === 2)
		      return ancestors.pop(node), true

		    ancestors.pop(node);
		  }
		}


		function traverseTree(ast, visitors, caller) {
		  traverse(ast, null);

		  function traverse(node, parent, idx, arr, parentArr) {
		    if (visitors && visitors[node.type] && visitors[node.type].enter)
		      visitors[node.type].enter.call(caller, node, parent, idx, arr, parentArr);

		    if (traversers[node.type])
		      traversers[node.type](node, traverse, arr);
		  }
		}


		var traversers = {
		  Stylesheet(node, callback, parentArr) {
		    for (var i = 0; i < node.rules.length; i++) {
		      let hasRemoved = callback(node.rules[i], node, i, node.rules, parentArr);
		      if (hasRemoved === true) i--;

		      if (typeof hasRemoved === "number")
		        i -= hasRemoved;
		    }
		  },

		  StyleRule(node, callback, parentArr) {
		    for (var i = 0; i < node.selectors.length; i++) {
		      let hasRemoved = callback(node.selectors[i], node, i, node.selectors, parentArr);
		      if (hasRemoved === true) i--;
		      if (typeof hasRemoved === "number")
		        i -= hasRemoved;
		    }
		    callback(node.rules, node);
		  },

		  SelectorPattern(node, callback, parArr) {
		    for (var i = 0; i < node.selectors.length; i++) {
		      var hasRemoved = callback(node.selectors[i], node, i, node.selectors, parArr);
		      if (hasRemoved === true) i--;
		    }
		  },

		  CharsetRule(node, callback) {
		    callback(node.encoding, node);
		  },

		  NamespaceRule(node, callback) {
		    if (node.prefix) callback(node.prefix, node);
		    callback(node.url, node);
		  },

		  ImportRule(node, callback) {
		    callback(node.url, node);
		    if (node.media)
		      for (var i = 0; i < node.media.length; i++){
		        var hasRemoved = callback(node.media[i], node, i, node.media);
		        if (hasRemoved) i--;
		      }
		  },

		  Block(node, callback) {
		    for (var i = 0; i < node.declarations.length; i++) {
		      var hasRemoved = callback(node.declarations[i], node, i, node.declarations);
		      if (hasRemoved) i--;
		    }
		  },

		  Declaration(node, callback) {
		    callback(node.value, node);
		  },

		  Value(node, callback) {
		    for (var i = 0; i < node.parts.length; i++) {
		      var hasRemoved = callback(node.parts[i], node, i, node.parts);
		      if (hasRemoved) i--;
		    }
		  },

		  MediaQueryList(node, callback) {
		    for (var i = 0; i < node.queries.length; i++) {
		      let hasRemoved = callback(node.queries[i], node, i, node.queries);
		      if (hasRemoved) i--;
		    }
		    for (var j = 0; j < node.selectors.length; j++) {

		      let hasRemoved = callback(node.selectors[j], node, j, node.selectors);
		      if (hasRemoved) j--;
		    }
		  },

		  MediaRule(node, callback) {
		    for (var i = 0; i < node.def.length; i++) {
		      let hasRemoved = callback(node.def[i], node, i, node.def);
		      if (hasRemoved) i--;
		    }
		  },

		  MediaFeature(node, callback) {
		    callback(node.prop, node);
		    callback(node.val, node);
		  },

		  KeyframesRule(node, callback) {
		    for (var i = 0; i < node.arguments.length; i++) {
		      let hasRemoved = callback(node.arguments[i], node, i, node.arguments);
		      if (hasRemoved) i--;
		    }
		  },

		  ComplexSelector(node, callback) {
		    for (var i = 0; i < node.selectors.length; i++) {
		      var selector = node.selectors[i];
		      var hasRemoved = callback(selector, node, i, node.selectors);
		      if (hasRemoved) i--;
		    }
		  },

		  Function(node, callback) {
		    for (var i = 0; i < node.arguments.length; i++) {
		      var hasRemoved = callback(node.arguments[i], node, i, node.arguments);
		      if (hasRemoved) i--;
		    }
		  },

		  AttributeSelector(node, callback) {
		    callback(node.name, node);
		    if (node.value !== null) callback(node.value, node);
		    if (node.flag !== null) callback(node.flag, node);
		  },

		  CounterStyleRule(node, callback) {
		    if (node.name !== null) callback(node.name, node);
		    if (node.declarations !== null) callback(node.declarations, node);
		  },

		  ViewportRule(node, callback) {
		    if (node.declarations !== null) callback(node.declarations, node);
		  },

		  ColorProfileRule(node, callback) {
		    if (node.name !== null) callback(node.name, node);
		    if (node.rules !== null) callback(node.rules, node);
		  },

		  PropertyRule(node, callback) {
		    if (node.name !== null) callback(node.name, node);
		    if (node.rules !== null) callback(node.rules, node);
		  },

		  FontPaletteValuesRule(node, callback) {
		    if (node.name !== null) callback(node.name, node);
		    if (node.rules !== null) callback(node.rules, node);
		  },

		  FontFaceRule(node, callback) {
		    if (node.rules !== null) callback(node.rules, node);
		  },

		  LayerRule(node, callback) {
		    for (var i = 0; i < node.names.length; i++) {
		      callback(node.names[i], node, i, node.names);
		    }

		    for (var i = 0; i < node.rules.length; i++) {
		      callback(node.rules[i], node, i, node.rules);
		    }
		  },

		  ScopeRule(node, callback) {
		    for (let i = 0; i < node.scopes.length; i++) {
		      callback(node.scopes[i], node, i, node.scopes);
		    }
		    for (let i = 0; i < node.rules.length; i++) {
		      callback(node.rules[i], node, i, node.rules);
		    }
		  },

		  Scope(node, callback) {
		    for (let i = 0; i < node.selectors.length; i++) {
		      callback(node.selectors[i], node, i, node.selectors);
		    }
		  },

		  DocumentRule(node, callback) {
		    for (var i = 0; i < node.functions.length; i++) {
		      var hasRemoved = callback(node.functions[i], node, i, node.functions);
		      if (hasRemoved) i--;
		    }
		    if (node.selectors !== null) callback(node.selectors, node);
		  },

		  FontFeatureValuesRule(node, callback) {
		    for (var i = 0; i < node.familyNames.length; i++) {
		      var hasRemoved = callback(node.familyNames[i], node, i, node.familyNames);
		      if (hasRemoved) i--;
		    }
		    if (node.features !== null) callback(node.features, node);
		  },

		  Feature(node, callback) {
		    if (node.declarations !== null) callback(node.declarations, node);
		  },

		  PageRule(node, callback) {
		    if (node.styleRule !== null) callback(node.styleRule, node);
		  },

		  SupportsRule(node, callback) {
		    for (var i = 0; i < node.queries.length; i++) {
		      let hasRemoved = callback(node.queries[i], node, i, node.queries);
		      if (hasRemoved) i--;
		    }
		    for (var j = 0; j < node.selectors.length; j++) {
		      let hasRemoved = callback(node.selectors[j], node, j, node.selectors);
		      if (hasRemoved) j--;
		    }
		  },

		  StartingStyleRule(node, callback) {
		    for (var j = 0; j < node.rules.length; j++) {
		      let hasRemoved = callback(node.rules[j], node, j, node.rules);
		      if (hasRemoved) j--;
		    }
		  },

		  ContainerRule(node, callback) {
		    for (var j = 0; j < node.conditions.length; j++) {
		      let hasRemoved = callback(node.conditions[j], node, j, node.conditions);
		      if (hasRemoved) j--;
		    }
		    if (node.rules !== null) callback(node.rules, node);
		  },

		  ContainerCondition(node, callback) {
		    if (node.prop !== null) callback(node.prop, node);
		    if (node.operator !== null) callback(node.operator, node);
		    if (node.val !== null) callback(node.val, node);
		  }
		};

		traverse = {
		  traverseParent,
		  traverseTree
		};
		return traverse;
	}

	var mangle;
	var hasRequiredMangle;

	function requireMangle () {
		if (hasRequiredMangle) return mangle;
		hasRequiredMangle = 1;
		function createNameGenerator(useSpecialChar) {
		  var i = 0;
		  var nameLength = 0;
		  var prependStrLen = 0;
		  var prependStr = "";
		  var identChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

		  return function getNextIdent() {
		    if (i >= identChar.length) {
		      i = 0;
		      prependStr = identChar[nameLength++];
		    }
		    if (nameLength >= identChar.length) {
		      nameLength = 0;
		      prependStr += identChar[prependStrLen++];
		    }
		    return prependStr + identChar[i++]
		  }
		}


		/**
		 * Mangling of selectors can be done in one pass because
		 * selectors are not declared and used separately.
		 */
		function makeMangledNameMap(map) {
		  var mangledNames = map || Object.create(null);
		  var getNextIdent = createNameGenerator();

		  return {
		    mangleName(selNode, externalMap) {
		      // second (and third etc) encounter of selector we reuse name
		      if (mangledNames[selNode.type + "_" + selNode.name]) {
		        selNode.name = mangledNames[selNode.type + "_" + selNode.name];
		      }
		      // first encounter we both mangle name and assign name to node
		      else if (!mangledNames[selNode.name]) {
		        var newName = getNextIdent();
		        mangledNames[selNode.type + "_" + selNode.name] = newName;
		        selNode.name = newName;
		      }
		    },
		    // hasMangledNameBefore(type, name) {
		    //   return !!mangledNames[type + "_" + name]
		    // },
		    // getMangledName(type, name) {
		    //   return mangledNames[type + "_" + name]
		    // },
		    getMangledNames() {
		      return mangledNames
		    }
		  }
		}

		mangle = {
		  createNameGenerator,
		  makeMangledNameMap
		};
		return mangle;
	}

	var hex;
	var hasRequiredHex;

	function requireHex () {
		if (hasRequiredHex) return hex;
		hasRequiredHex = 1;
		// all hex values (short or long) that has a shorter colorname
		hex = {
		  "#f00": "red",
		  "#ff0000": "red",
		  "#00ff00": "lime",
		  "#00ffff": "cyan",
		  "#0000ff": "blue",
		  "#000000": "black",
		  "#4b0082": "indigo",
		  "#000080": "navy",
		  "#008000": "green",
		  "#008080": "teal",
		  "#800000": "maroon",
		  "#800080": "purple",
		  "#808000": "olive",
		  "#808080": "grey",
		  "#a52a2a": "brown",
		  "#a0522d": "sienna",
		  "#c0c0c0": "silver",
		  "#cd853f": "peru",
		  "#d2b48c": "tan",
		  "#da70d6": "orchid",
		  "#dda0dd": "plum",
		  "#ee82ee": "violet",
		  "#f0e68c": "khaki",
		  "#f0ffff": "azure",
		  "#f5deb3": "wheat",
		  "#f5f5dc": "beige",
		  "#fa8072": "salmon",
		  "#faf0e6": "linen",
		  "#ff7f50": "coral",
		  "#ff6347": "tomato",
		  "#ffa500": "orange",
		  "#ffc0cb": "pink",
		  "#ffd700": "gold",
		  "#ffe4c4": "bisque",
		  "#fffafa": "snow",
		  "#ffff00": "yellow",
		  "#fffff0": "ivory",
		  "#ffffff": "white"
		};
		return hex;
	}

	var colornames;
	var hasRequiredColornames;

	function requireColornames () {
		if (hasRequiredColornames) return colornames;
		hasRequiredColornames = 1;
		// all colornames longer than its (shortest) hex represenation
		colornames = {
		  aliceblue: "#f0f8ff",
		  antiquewhite: "#faebd7",
		  aquamarine: "#7fffd4",
		  black: "#000",
		  blanchedalmond: "#ffebcd",
		  blueviolet: "#8a2be2",
		  burlywood: "#deb887",
		  cadetblue: "#5f9ea0",
		  chartreuse: "#7fff00",
		  chocolate: "#d2691e",
		  cornflowerblue: "#6495ed",
		  cornsilk: "#fff8dc",
		  darkblue: "#00008b",
		  darkcyan: "#008b8b",
		  darkgoldenrod: "#b8860b",
		  darkgray: "#a9a9a9",
		  darkgreen: "#006400",
		  darkgrey: "#a9a9a9",
		  darkkhaki: "#bdb76b",
		  darkmagenta: "#8b008b",
		  darkolivegreen: "#556b2f",
		  darkorange: "#ff8c00",
		  darkorchid: "#9932cc",
		  darksalmon: "#e9967a",
		  darkseagreen: "#8fbc8f",
		  darkslateblue: "#483d8b",
		  darkslategray: "#2f4f4f",
		  darkslategrey: "#2f4f4f",
		  darkturquoise: "#00ced1",
		  darkviolet: "#9400d3",
		  deeppink: "#ff1493",
		  deepskyblue: "#00bfff",
		  dodgerblue: "#1e90ff",
		  firebrick: "#b22222",
		  floralwhite: "#fffaf0",
		  forestgreen: "#228b22",
		  fuchsia: "#f0f",
		  gainsboro: "#dcdcdc",
		  ghostwhite: "#f8f8ff",
		  goldenrod: "#daa520",
		  greenyellow: "#adff2f",
		  honeydew: "#f0fff0",
		  indianred: "#cd5c5c",
		  lavender: "#e6e6fa",
		  lavenderblush: "#fff0f5",
		  lawngreen: "#7cfc00",
		  lemonchiffon: "#fffacd",
		  lightblue: "#add8e6",
		  lightcoral: "#f08080",
		  lightcyan: "#e0ffff",
		  lightgoldenrodyellow: "#fafad2",
		  lightgray: "#d3d3d3",
		  lightgreen: "#90ee90",
		  lightgrey: "#d3d3d3",
		  lightpink: "#ffb6c1",
		  lightsalmon: "#ffa07a",
		  lightseagreen: "#20b2aa",
		  lightskyblue: "#87cefa",
		  lightslategray: "#789",
		  lightslategrey: "#789",
		  lightsteelblue: "#b0c4de",
		  lightyellow: "#ffffe0",
		  limegreen: "#32cd32",
		  magenta: "#f0f",
		  mediumaquamarine: "#66cdaa",
		  mediumblue: "#0000cd",
		  mediumorchid: "#ba55d3",
		  mediumpurple: "#9370db",
		  mediumseagreen: "#3cb371",
		  mediumslateblue: "#7b68ee",
		  mediumspringgreen: "#00fa9a",
		  mediumturquoise: "#48d1cc",
		  mediumvioletred: "#c71585",
		  midnightblue: "#191970",
		  mintcream: "#f5fffa",
		  mistyrose: "#ffe4e1",
		  moccasin: "#ffe4b5",
		  navajowhite: "#ffdead",
		  olivedrab: "#6b8e23",
		  orangered: "#ff4500",
		  palegoldenrod: "#eee8aa",
		  palegreen: "#98fb98",
		  paleturquoise: "#afeeee",
		  palevioletred: "#db7093",
		  papayawhip: "#ffefd5",
		  peachpuff: "#ffdab9",
		  powderblue: "#b0e0e6",
		  rebeccapurple: "#639",
		  rosybrown: "#bc8f8f",
		  royalblue: "#4169e1",
		  "saddle-brown": "#8b4513",
		  sandybrown: "#f4a460",
		  seagreen: "#2e8b57",
		  seashell: "#fff5ee",
		  slateblue: "#6a5acd",
		  slategray: "#708090",
		  slategrey: "#708090",
		  springgreen: "#00ff7f",
		  steelblue: "#4682b4",
		  turquoise: "#40e0d0",
		  white: "#fff",
		  whitesmoke: "#f5f5f5",
		  yellow: "#ff0",
		  yellowgreen: "#9acd32"
		};
		return colornames;
	}

	var util;
	var hasRequiredUtil;

	function requireUtil () {
		if (hasRequiredUtil) return util;
		hasRequiredUtil = 1;
		function convertExprToRPN(expression) {
		  var tokens = expression;
		  var outputQueue = [];
		  var operatorStack = [];
		  var precedence = {
		    '+': 1,
		    '-': 1,
		    '*': 2,
		    '/': 2
		  };

		  function getPrecedence(operator) {
		    return precedence[operator] || 0
		  }

		  for (var token of tokens) {
		    if (!isNaN(token)) {
		      outputQueue.push(token);
		    } else if (token === '(') {
		      operatorStack.push(token);
		    } else if (token === ')') {
		      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
		        outputQueue.push(operatorStack.pop());
		      }
		      if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1] !== '(') {
		        throw new Error('Mismatched parentheses')
		      }
		      operatorStack.pop();
		    } else if (token in precedence) {
		      while (
		        operatorStack.length > 0 &&
		        getPrecedence(token) <= getPrecedence(operatorStack[operatorStack.length - 1])
		      ) {
		        outputQueue.push(operatorStack.pop());
		      }
		      operatorStack.push(token);
		    }
		  }

		  while (operatorStack.length > 0) {
		    outputQueue.push(operatorStack.pop());
		  }

		  return outputQueue
		}


		function evaluateBinaryExpression(left, operator, right) {
		  if (operator === "*") return left * right
		  if (operator === "+") return left + right
		  if (operator === "/") return left / right
		  if (operator === "-") return left - right
		}


		function evaluateVariableLengthExpression(exprArr) {
		  var operandStack = [];

		  for (var token of exprArr) {
		    if (!isNaN(token)) {
		      operandStack.push(parseFloat(token));
		    } else if ('+-*/'.includes(token)) {
		      var right = operandStack.pop();
		      var left = operandStack.pop();
		      var result = evaluateBinaryExpression(left, token, right);
		      operandStack.push(result);
		    }
		  }

		  return operandStack[0]
		}


		// extend to consider important
		function propOverrides(src, compare) {
		  return (
		    src.property === compare.property &&
		    src.value.parts.length === compare.value.parts.length
		  )
		}


		// extend to consider important
		function includesAll(arr, searchArr, prop) {
		  for (var obj of arr)
		    if (!searchArr.some(el => propOverrides(obj, el)))
		      return false
		  return true
		}


		/**
		 * Strings will save prefix 000. We dont want these,
		 * nor do we want 0.1 when CSS can execute it as .1
		 * 000.09100 -> .091
		 * 00030 -> 30
		 */
		function trimRedundantZeros(strNum) {
		  strNum = parseFloat(strNum).toString();
		  if (strNum[0] === "0" && strNum.length !== 1)
		    strNum = strNum.slice(1);
		  return strNum
		}


		/**
		 * Removes excess objects with same 'key' value,
		 * keeps objects with 'ignoreKey' and 'ignoreVal'.
		 */
		function removeDuplicateObjects(arr, key, ignoreKey, ignoreVal) {
		  var seen = Object.create(null);

		  return arr.filter(function(obj) {
		    if (obj[ignoreKey] === ignoreVal) return true
		    return seen[obj[key]] ? false : (seen[obj[key]] = true)
		  })
		}


		function attemptMakeColorName(hex) {
		  var hexMap = requireHex();
		  var colorname = hexMap["#"+hex.toLowerCase()];
		  return colorname || hex
		}


		function attemptMakeHex(color) {
		  var colorNames = requireColornames();
		  var hex = colorNames[color.toLowerCase()];
		  return hex ? hex.slice(1) : color
		}


		// a hex can only be shortened if pairs match,
		// eg: 000000 or ff7722
		function canShortenHex(hex) {
		  return (
		    hex.length === 6  &&
		    hex[0] === hex[1] &&
		    hex[2] === hex[3] &&
		    hex[4] === hex[5]
		  )
		}


		// attempt to shorten if 6 char hex.
		// if alpha, cant be shortened.
		function attemptShortenHex(hex) {
		  return canShortenHex(hex)
		    ? hex[0] + hex[2] + hex[4]
		    : hex
		}


		function toHex(n) {
		  var hex = n.toString(16);
		  while (hex.length < 2) hex = "0" + hex;
		  return hex
		}


		function RGBToHex(r, g, b, a) {
		  return a
		    ? toHex(r)+toHex(g)+toHex(b)+toHex(Math.round(parseFloat(a) * 255))
		    : toHex(r)+toHex(g)+toHex(b)
		}


		function switchPos(arr, i, j) {
		  var temp = arr[i];
		  arr[i] = arr[j];
		  arr[j] = temp;
		}


		function replaceNodeAt(arr, index, newNode) {
		  return Array.isArray(newNode) ?
		    (arr.splice(index, 1, ...newNode), newNode) :
		    (arr.splice(index, 1, newNode), newNode)
		}


		function removeNodeAt(arr, index) {
		  return arr.splice(index, 1)
		}


		function shallowCopy(objects) {
		  return objects.map((obj) => Object.assign({}, obj))
		}


		function makeMultiKeyMap() {
		  var vals = Object.create(null);

		  return {
		    add(key, val) {
		      vals[key]
		      ? vals[key].push(val)
		      : vals[key] = [val];
		    },
		    get(key) {
		      return this.hasMulti(key)
		        ? vals[key]
		        : vals[key][0]
		    },
		    exists(key) {
		      return vals[key]
		    },
		    hasMulti(key) {
		      return !!(this.exists(key) && vals[key].length > 1)
		    },
		    keys(key) {
		      return vals
		    },
		    getAllSingle() {
		      var arr = [];
		      for (var key in vals)
		        if (vals[key].length === 1)
		          arr.push(vals[key][0]); 
		      return arr
		    },
		    getAllMulti() {
		      var arr = [];
		      for (var key in vals)
		        if (vals[key].length > 1)
		          arr.push(vals[key]);
		      return arr
		    }
		  }
		}

		util = {
		  convertExprToRPN,
		  evaluateVariableLengthExpression,
		  removeNodeAt,
		  replaceNodeAt,
		  switchPos,
		  RGBToHex,
		  canShortenHex,
		  attemptMakeHex,
		  attemptShortenHex,
		  attemptMakeColorName,
		  removeDuplicateObjects,
		  trimRedundantZeros,
		  includesAll,
		  propOverrides,
		  shallowCopy,
		  makeMultiKeyMap
		};
		return util;
	}

	var _var;
	var hasRequired_var;

	function require_var () {
		if (hasRequired_var) return _var;
		hasRequired_var = 1;
		const {
		  replaceNodeAt,
		  removeNodeAt,
		  shallowCopy,
		  makeMultiKeyMap
		} = requireUtil();


		_var = class VariableManager {
		  constructor() {
		    this.customProperties = makeMultiKeyMap();
		    this.propertyAtRules  = makeMultiKeyMap();
		  }

		  addPropertyRule(node, siblings, index) {
		    this.propertyAtRules.add(
		      node.name.name,
		      { node, siblings, index }
		    );
		  }

		  addNormalDeclaration(node, siblings, index) {
		    this.customProperties.add(
		      node.property,
		      { node, siblings, index },
		    );
		  }

		  removeSafeDeclarations() {
		    this.propertyAtRules.getAllMulti().forEach((nodes, i) => {
		      for (var i = 0; i < nodes.length-1; i++) {
		        removeNodeAt(nodes[i].siblings, nodes[i].index-i);
		      }
		    });

		    var array = this.customProperties.getAllSingle();
		    for (var i = 0; i < array.length; i++)
		      removeNodeAt(array[i].siblings, array[i].index-i);
		  }

		  hasDeclaration(node) {
		    return this.customProperties.exists(node.arguments[0].name)
		  }

		  resolveSafeRef(node, parent, var_ref_index) {
		    var var_ref_name = node.arguments[0].name;

		    if (this.customProperties.hasMulti(var_ref_name))
		      return false

		    replaceNodeAt(
		      parent.parts,
		      var_ref_index,
		      shallowCopy(this.customProperties.get(var_ref_name).node.value.parts)
		    );

		    return true
		  }
		};
		return _var;
	}

	/**
	 * rgba is legacy. modern css
	 * implementations converts rgba to rgb.
	 */

	var preds;
	var hasRequiredPreds;

	function requirePreds () {
		if (hasRequiredPreds) return preds;
		hasRequiredPreds = 1;
		function isRGB(node) {
		  return ["rgb", "rgba"].includes(node.name.toLowerCase())
		}

		/**
		 * True for any declaration value
		 * that is not a custom property.
		 */
		function isPlainDeclarationValue(parent, grandparent) {
		  return (
		    grandparent && grandparent.type === "Declaration"
		    && parent && parent.type === "Value"
		    && !isCustomProperty(grandparent)
		  )
		}

		function isCustomProperty(declaration) {
		  return declaration.property.startsWith("--")
		}

		function isVariableRef(fn) {
		  return fn.name.toLowerCase() === "var"
		}

		function isUrl(fn) {
		  return fn.name.toLowerCase() === "url"
		}

		function isBinaryCalcFunction(fn) {
		  return fn.name === "calc" && fn.arguments.length > 1
		}

		function isInterchangableStringAndUrlContext(parent) {
		  return parent.url && (parent.type === "NamespaceRule" || parent.type === "ImportRule")
		}

		function isAnimationNamePermissibleProperty(decl) {
		  return decl.property === "animation" || decl.property === "animation-name"
		}

		/**
		 * Is empty if has no own enumerable stringed keys.
		 */
		function isEmpty(val) {
		  return typeof val === "object" && val !== null && Object.keys(val)
		}

		function isOrderDependantShorthandProp(property) {
		  return property === "margin"
		    || property === "padding"
		    || property === "border-radius"
		}

		function isDatatypeDependantShorthandProp(property) {
		  return property === "border"
		    || property === "background"
		    || property === "font"
		}

		preds = {
		  isRGB,
		  isPlainDeclarationValue,
		  isCustomProperty,
		  isVariableRef,
		  isUrl,
		  isBinaryCalcFunction,
		  isInterchangableStringAndUrlContext,
		  isAnimationNamePermissibleProperty,
		  isEmpty,
		  isOrderDependantShorthandProp,
		  isDatatypeDependantShorthandProp
		};
		return preds;
	}

	var visitors;
	var hasRequiredVisitors;

	function requireVisitors () {
		if (hasRequiredVisitors) return visitors;
		hasRequiredVisitors = 1;
		const { isEmpty, isCustomProperty } = requirePreds();

		visitors = {
		  NamespaceRule: {
		    enter(node) {
		      if (this.config.mangleNamespaceNames && isEmpty(this.config.preMangledNames.namespaces)) {
		        if (node.prefix && !this.mangledNamespaceMap[node.prefix.name])
		          this.mangledNamespaceMap[node.prefix.name] = this.getUniqueNamespaceName();
		      }
		    }
		  },

		  PropertyRule: {
		    enter(node, parent, index, visit, siblings) {
		      this.varManager.addPropertyRule(node, siblings, index, this.config.resolveVariables);
		    }
		  },

		  KeyframesRule: {
		    enter(node, parent, index) {
		      if (this.config.mangleKeyframeNames && isEmpty(this.config.preMangledNames.namespaces)) {
		        // if name already exists, means we met keyframe with same org name before. use this name for second keyframe. dont update map.
		        if (this.mangledKeyframesMap[node.name.name])
		          node.name.name = this.mangledKeyframesMap[node.name.name];
		        else {
		          // if havent met keyframe before. create new name for it.
		          var newName = this.getUniqueKeyframeName();
		          this.mangledKeyframesMap[node.name.name] = newName;
		          node.name.name = newName;
		        }
		      }
		    }
		  },

		  Declaration: {
		    enter(node, parent, index, visit, siblings) {
		      // only add if we dont use prefilled usermap and mangle is defined
		      if (
		        isCustomProperty(node) &&
		        this.config.mangleVariables &&
		        !this.config.resolveVariables &&
		        isEmpty(this.config.preMangledNames.variables)
		      ) {
		        if (!this.mangledCustomProps[node.property])
		          this.mangledCustomProps[node.property] = "--" + this.getUniqueVariableName();

		        return
		      }

		      if (isCustomProperty(node) && this.config.resolveVariables) {
		        this.varManager.addNormalDeclaration(node, siblings, index);
		      }
		    }
		  }
		};
		return visitors;
	}

	var infer;
	var hasRequiredInfer;

	function requireInfer () {
		if (hasRequiredInfer) return infer;
		hasRequiredInfer = 1;
		const { traverseTree } = requireTraverse();
		const { createNameGenerator, makeMangledNameMap } = requireMangle();
		const VariableManager = require_var(); // varMap - table
		const visitors = requireVisitors();

		infer = class Inferrer {
		  constructor(ast, config) {
		    this.ast = ast;
		    this.config = config;
		    this.varManager = new VariableManager();

		    this.mangledCustomProps = Object.create(null);
		    this.getUniqueVariableName = createNameGenerator();

		    this.mangledNamespaceMap = Object.create(null);
		    this.getUniqueNamespaceName = createNameGenerator();

		    this.mangledKeyframesMap = Object.create(null);
		    this.getUniqueKeyframeName = createNameGenerator();

		    this.visitors = visitors;
		  }

		  infer() {
		    traverseTree(this.ast, this.visitors, this);
		    // remove after traverse, so deletetion is not a problem
		    this.varManager.removeSafeDeclarations();

		    return {
		      varManager: this.varManager,
		      mangledCustomProps: this.mangledCustomProps,
		      mangledNamespaceMap: this.mangledNamespaceMap,
		      mangledKeyframesMap: this.mangledKeyframesMap
		    }
		  }
		};
		return infer;
	}

	var nodes;
	var hasRequiredNodes;

	function requireNodes () {
		if (hasRequiredNodes) return nodes;
		hasRequiredNodes = 1;
		function createQuotelessUrlNode(val, name) {
		  return {
		    type: "QuotelessUrl",
		    val: val,
		    name: name
		  }
		}

		function createStringNode(val, delimiter) {
		  return {
		    type: "String",
		    val: val,
		    delimiter: delimiter
		  }
		}

		function createDimensionNode(val, unit, isInt, isEpsilon) {
		  return {
		    type: "Dimension",
		    val,
		    unit, // px, em, rem
		    isInt: isInt || false,
		    isEpsilon: !!isEpsilon
		  }
		}

		function createNumberNode(val, isInt, isEpsilon) {
		  return {
		    type: "Number",
		    val,
		    isInt: isInt || false,
		    isEpsilon: !!isEpsilon
		  }
		}

		function createHexNode(val) {
		  return {
		    type: "Hex",
		    val: val
		  }
		}

		function createStatementNode(name) {
		  return {
		    type: "Statement",
		    important: false,
		    property: name,
		    value: {
		      type: "Value",
		      parts: []
		    }
		  }
		}

		function createIdentifierNode(name, locObj) { 
		  var node = {
		    type: "Identifier",
		    name: name
		  };
		  if (locObj) node.loc = locObj;
		  return node
		}

		nodes = {
		  createDimensionNode,
		  createHexNode,
		  createStatementNode,
		  createNumberNode,
		  createIdentifierNode,
		  createStringNode,
		  createQuotelessUrlNode
		};
		return nodes;
	}

	var shorthandMap;
	var hasRequiredShorthandMap;

	function requireShorthandMap () {
		if (hasRequiredShorthandMap) return shorthandMap;
		hasRequiredShorthandMap = 1;
		shorthandMap = Object.assign(Object.create(null), {
		  margin: {
		    order: {
		      "margin-top": 0,
		      "margin-right": 1,
		      "margin-bottom": 2,
		      "margin-left": 3
		    },
		    subProperties: [
		      "margin-top",
		      "margin-right",
		      "margin-bottom",
		      "margin-left"
		    ]
		  },
		  padding: {
		    order: {
		      "padding-top": 0,
		      "padding-right": 1,
		      "padding-bottom": 2,
		      "padding-left": 3
		    },
		    subProperties: [
		      "padding-top",
		      "padding-right",
		      "padding-bottom",
		      "padding-left"
		    ]
		  },
		  "border-radius": {
		    order: {
		      "border-top-left-radius": 0,
		      "border-top-right-radius": 1,
		      "border-bottom-right-radius": 2,
		      "border-bottom-left-radius": 3
		    },
		    subProperties: [
		      "border-top-left-radius",
		      "border-top-right-radius",
		      "border-bottom-right-radius",
		      "border-bottom-left-radius"
		    ]
		  },
		  border: {
		    order: {
		      "border-color": 0,
		      "border-width": 1,
		      "border-style": 2
		    },
		    subProperties: [
		      "border-color",
		      "border-width",
		      "border-style"
		    ]
		  },
		  background: {
		    order: {
		      "background-attachment": 0,
		      "background-clip": 1,
		      "background-color": 2,
		      "background-image": 3,
		      "background-origin": 4,
		      "background-position": 5,
		      "background-size": 6,
		      "background-repeat": 7
		    },
		    subProperties: [
		      "background-attachment",
		      "background-clip",
		      "background-color",
		      "background-image",
		      "background-origin",
		      "background-position",
		      "background-size",
		      "background-repeat"
		    ]
		  },
		  // font: {
		  //   order: {
		  //     "font-family": 0,
		  //     "font-size": 1,
		  //     "font-stretch": 2,
		  //     "font-style": 3,
		  //     "font-variant": 4,
		  //     "font-weight": 5,
		  //     "line-height": 6
		  //   },
		  //   subProperties: [
		  //     "font-family",
		  //     "font-size",
		  //     "font-stretch",
		  //     "font-style",
		  //     "font-variant",
		  //     "font-weight",
		  //     "line-height"
		  //   ]
		  // },
		  //
		  // animation: {
		  //   order: {
		  //     "animation-duration": 0,
		  //     "animation-delay": 1,
		  //     "animation-direction": 2,
		  //     "animation-fill-mode": 3,
		  //     "animation-iteration-count": 4,
		  //     "animation-name": 5,
		  //     "animation-play-state": 6,
		  //     "animation-timing-function": 7
		  //   },
		  //   subProperties: [
		  //     "animation-duration",
		  //     "animation-delay",
		  //     "animation-direction",
		  //     "animation-fill-mode",
		  //     "animation-iteration-count",
		  //     "animation-name",
		  //     "animation-play-state",
		  //     "animation-timing-function"
		  //   ]
		  // }
		});
		return shorthandMap;
	}

	var treeUtil;
	var hasRequiredTreeUtil;

	function requireTreeUtil () {
		if (hasRequiredTreeUtil) return treeUtil;
		hasRequiredTreeUtil = 1;
		const {
		  switchPos,
		  removeDuplicateObjects,
		  includesAll,
		  propOverrides
		} = requireUtil();

		const shorthandMap = requireShorthandMap();


		function optimizeValueAmount(values) {
		  // margin: 20px 20px; -> margin: 20px;
		  if (values.length === 2 && sameValueExact(values[0], values[1]))
		     values.splice(0, 1);

		  // margin: 20px 30px 20px; -> margin: 20px 30px;
		  // in BOTH the user-shorthand and our shortened-shorthand CSS is assuming the last (left) value is 30px! hence why safe to shorten.
		  else if (values.length === 3 && sameValueExact(values[0], values[2]))
		     values.splice(-1);

		  // margin: 20px 20px 20px 20px; -> margin: 20px;
		  else if (values.length === 4 && allPropertyValuesSame(values))
		    values.splice(1, 3);

		  // margin: 20px 30px 20px 30px; -> margin: 20px 30px;
		  // having this below allPropertyValuesSame makes sure it will only match in cases where pairs match, but the 4 values are not all the same value
		  else if (values.length === 4 && sameValueExact(values[0], values[2]) && sameValueExact(values[1], values[3]))
		     values.splice(0, 2);

		  // margin: 50px 30px 60px 30px; -> margin: 50px 30px 60px;
		  else if (values.length === 4 && !sameValueExact(values[0], values[2]) && sameValueExact(values[1], values[3]))
		      values.splice(-1);
		}


		// arranges declaration values in an order that minimizes the number of whitespaces needed to separate values,
		// by using the values own delimiters. essentially makes sure no delims are next to eachother.
		function optimizeValueOrder(parts) {
		  var lastIndex = parts.length-1;
		  var lastValue = parts[lastIndex];

		  var lastValueEndsWithDelimiter = lastValue.type === "Percentage" || lastValue.type === "Function";
		  var firstValueStartsWithDelimiter = parts[0].type === "Hex";

		  if (lastValueEndsWithDelimiter) {
		    var index = parts.findIndex((value) => value.type !== "Percentage" && value.type !== "Function");
		    if (index !== -1)
		      switchPos(parts, index, lastIndex);
		  }

		  if (firstValueStartsWithDelimiter) {
		    var index = parts.findIndex((value) => value.type !== "Hex");
		    if (index !== -1)
		      switchPos(parts, index, 0);
		  }
		}


		function getExprParts(args) {
		  var exprArray = [];
		  for (var arg of args)
		    exprArray.push(arg.val);
		  return exprArray
		}


		function getGrandparent(ancestors) {
		  return ancestors[ancestors.length-3]
		}


		function removeOverridenDeclarations(node, declarations) {
		  node.rules.declarations = removeDuplicateObjects(
		    declarations.reverse(),
		    "property",
		    "type",
		    "Comment"
		  ).reverse();
		  return declarations.length - node.rules.declarations.length
		}


		// removes shorthand after longhand. even if shorthand dont have the exact value of the longhand, becasuse the browser expands the shorthand to all 4 values always.
		// so margin: 20px, will always override, margin-left.
		function removeOverridenLonghands(node, declarations) {
		  for (var key in shorthandMap) {
		    var order = shorthandMap[key].order;
		    var { index: indexOfShorthand, declaration: shorthandProp } = getProperty(key, node.rules.declarations);
		    var hasShorthandProp = shorthandProp !== null;

		    if (hasShorthandProp) {
		      for (var i = 0; i < indexOfShorthand; i++) {
		        if (order[node.rules.declarations[i].property]) {
		          node.rules.declarations.splice(i, 1);
		        }
		      }
		    }
		  }
		}

		// maybe, attempt
		// shorten properties   attemptShortemLonghandProperties
		function shortenLongHands(node) {
		  for (var key in shorthandMap) {
		    var longhands = [];
		    var subProperties = shorthandMap[key].subProperties;
		    var order = shorthandMap[key].order;

		    var { index: indexOfShorthand, declaration: shorthandProp } = getProperty(key, node.rules.declarations);
		    var hasShorthandProp = shorthandProp !== null;

		    // if has shorthand
		    if (hasShorthandProp) {
		      // function getAllLonghandsOfShorthand(declarations) { // regardless of pos - loop until?
		        subProperties.forEach((prop, i) => { // getDeclarationByPropName
		          var { declaration } = getProperty(prop, node.rules.declarations, indexOfShorthand); // +1
		          if (declaration) longhands.push(declaration);
		        });
		      // }

		      // only do if actually has at least one longhand after (to prevent expanding then deflating again)
		      // and we have longhand

		      // merge any longshands into the shorthand
		      if (longhands.length) {
		        // expand the values into what CSS sees:

		        // createMargin - createShorthand? createProp
		        if (isOrderDependantShorthandProp(shorthandProp.property)) {
		          // given a prop of margin, border, padding - expand the current value(s) into 4 values (what draw engine does)
		          // function unfoldShorthand(shorthandProp) {
		          var parts = shorthandProp.value.parts;
		          if (parts.length === 1) parts.push(parts[0], parts[0], parts[0]);
		          if (parts.length === 2) parts.push(parts[0], parts[1]);
		          if (parts.length === 3) parts.push(parts[1]);
		          // }

		          // wehther longhand after or before doenst matter?
		          // how to shorten after?? run optimize shorthand?
		          // add each longhand to its correct margin/shorthand position
		          longhands.forEach((longhandProp) => {
		            // do we know we saved space?
		            // check length of each here before we remove/add?
		            // is this the only place we cant be sure result is shorter?
		            parts.splice(order[longhandProp.property], 1, longhandProp.value.parts[0]); // we know only one value in longhand.. hence [0]
		            // remove the longhand AFTER margin
		            node.rules.declarations.splice(node.rules.declarations.indexOf(longhandProp), 1);
		          });
		        }
		        else if (isDatatypeDependantShorthandProp(shorthandProp.property)) {
		          longhands.forEach((longhandProp) => {
		            // just pushing is ok here, for border, but fails for animation|background|font?
		            shorthandProp.value.parts.push(longhandProp.value.parts[0]); // we know only one value in longhand.. hencey [0] - assumes correct declaration format used, meaning only one value
		            node.rules.declarations.splice(node.rules.declarations.indexOf(longhandProp), 1);
		          });
		        }
		      }
		    }
		    // so: if ALL longhands (subprop) of a shorthand is present, it is safe to replace them with a shorthand.

		    // if no shorthand, create it
		    else if (!hasShorthandProp) { // any they are NOT dupli, which this implies by the way we find the longhands
		      subProperties.forEach((prop, i) => { // foreach key? in?
		        getProperty(prop, node.rules.declarations);
		        if (statement) longhands.push(statement);
		      });

		      var isAnyImportant = false;

		      for (var prop of longhands) {
		        if (prop.important === true) {
		          isAnyImportant = true;
		          break
		        }
		      }

		      var allLonghandsPresent = longhands.length === subProperties.length && !isAnyImportant;

		      if (allLonghandsPresent) {
		        var newNode = createStatementNode(key);

		        longhands.forEach((longhandProp) => {
		          // we looked for, and pushed in the same order we want to add to the new margin node - for border, order don't matter - for anim it does!
		          newNode.value.parts.push(longhandProp.value.parts[0]); // longhand always just have one value
		          node.rules.declarations.splice(longhandProp, 1);
		        });

		        // add a new "margin" node to the end of the selector declarations, using the 4 shorthand values
		        node.rules.declarations.push(newNode);
		      }
		    }
		  }

		  // return node?
		}


		// true if two arrays with selector nodes, representing a selector pattern, have the same nodes in every position
		function equalSelectorPatterns(a, b) {
		  if (a.length !== b.length)
		    return false

		  for (var i = 0; i < a.length; i++) {
		    if (!isEqualSelector(a[i], b[i])) return false
		    // if true, b is also ComplexSelector, since prev line only passes if both are
		    if (a[i].type === "ComplexSelector")
		      // if both ComplexSelector call this function again to test nodes of its sub array against eachother
		      if (!equalSelectorPatterns(a[i].selectors, b[i].selectors)) return false
		  }

		  return true
		}


		// true if a and b is the same selector node visually (e.g. #app and #app)
		function isEqualSelector(a, b) {
		  if (a.type === "ComplexSelector" || a.type === "UniversalSelector" || a.type === "NestingSelector")
		    return b.type === a.type

		  else if (a.type === "IdSelector"     ||
		    a.type === "ClassSelector"         ||
		    a.type === "TagSelector"           ||
		    a.type === "PsuedoElementSelector" ||
		    a.type === "PseudoClassSelector"   ||
		    a.type === "Combinator")
		      return b.type === a.type && b.name === a.name

		  // in keyframes, a selector can be a percentage
		  else if (a.type === "Percentage")
		    a.type === b.type && a.val === b.val;

		  else if (a.type === "AttributeSelector")
		    return a.type === b.type      &&
		      a.name.name === b.name.name &&
		      a.operator  === b.operator  &&
		      a.value.val === b.value.val &&
		      a.flag.name === b.flag.name

		  // most likely caused by not adding an 'if' check for a node type that exists in our progam. or traverser complain. add check? so dont run traverse for it...
		  throw new TypeError("Unknown type passed when comparing selector node equality in 'equalSelector'")
		}

		// add to map when . can be multi dupli? so map dont work?
		// we avoid double loop if trigger in right visitor?
		// we are merging the 'declarations', not 'selectors'? STYLERULE! not decl or sel
		function mergeDuplicateSelectors(node, visitedSelectorPatterns, parent) {
		  visitedSelectorPatterns.forEach((visitedPattern, idx) => {
		    var currPattern = node.selectors;
		    var prevPattern = visitedPattern.selectorPattern.selectors;

		    // console.log(currPattern);
		    if (equalSelectorPatterns(currPattern, prevPattern)) {
		      var visitedNodeStatements = visitedPattern.styleRule.rules.declarations;
		      console.log(parent);
		      var nodeStatements = parent.rules.declarations;
		      var allPropsOverridden = includesAll(visitedNodeStatements, nodeStatements, "property"); // property not used for now
		      var isPartOfList = isSelectorList(visitedPattern.styleRule); // use let? or just same, since only once?

		      if (!isPartOfList && allPropsOverridden && visitedPattern.parentArr) { // or parent.type === "PageRule"
		        let idx = visitedPattern.parentArr.indexOf(visitedPattern.styleRule); // removes entire keyFrames? we want only selector inside. so hardcoded ast.rules path dont work!
		        visitedPattern.parentArr.splice(idx, 1);
		        // return "delStyleRule"
		        return 2
		      }
		      else if (!isPartOfList && !allPropsOverridden) {
		        for (var i = 0; i < visitedNodeStatements.length; i++) {
		          var statement = visitedNodeStatements[i];
		          // not all declarations overriden, but find the ones that are, and delete them
		          if (nodeStatements.findIndex(item => propOverrides(item, statement)) !== -1)
		            visitedNodeStatements.splice(i--, 1);
		        }
		      }

		      else if (isPartOfList && allPropsOverridden) {
		        // we always in selpattern. and struct of stylerule is always same. hence why its OK to hardcode paths if we go DOWN?
		        let idx = visitedPattern.styleRule.selectors.indexOf(visitedPattern.selectorPattern); // check index inside the ast. not in visitprpattenr. hence works.
		        visitedPattern.styleRule.selectors.splice(idx, 1);
		        return true
		      }

		      else if (isPartOfList && !allPropsOverridden) {
		        var nonOverriddenProps = getUnique(visitedNodeStatements, nodeStatements, "property"); // property not used for now
		        var selectorLongerThanDeclarations = isLonger(visitedPattern.selectorPattern.selectors, nonOverriddenProps);

		        if (selectorLongerThanDeclarations) {
		          let idx = visitedPattern.styleRule.selectors.indexOf(visitedPattern.selectorPattern);
		          visitedPattern.styleRule.selectors.splice(idx, 1);

		          nonOverriddenProps.forEach((decl, i) => {
		            nodeStatements.push(decl);
		          });
		        }

		        return true
		      }
		    }
		  });
		}

		// checks specific props. need to know val/unit/name/type props for all , should always keep them same anyway? so can assume?
		// allows both type and unit as validators for legitimacy
		// true if all nodes in arr is of one of the types in types
		function nodesAreTypes(arr, ...types) {
		  for (var item of arr) {
		    if (!types.includes(item.type) && !types.includes(item.unit))
		      return false
		  }
		  return true
		}


		function isSelectorList(stylerule) {
		  return stylerule.selectors.length > 1
		}


		/**
		 * Gets the predicted length of an
		 * declaration node when printed minified.
		 * this doenst factor in comments that migth be removd or preserved. or ws. or all nodes? eg delim?
		 alt: loc data. ws/comment flag to preserve them.
		 alt: add length prop in tokenizer to token/node
		 */
		 // need to understand the rule of the printer. even the optimizations of order. for diff decl.
		function getDeclarationLen(decl) {
		  // "property" + "!important" + ":" + ";"
		  var len = decl.property.length + (decl.important ? 12 : 2);
		  walk(decl.value.parts);

		  function walk(parts, inFn) {
		    parts.forEach((part, i, parts) => {
		      // not first, nor in fn, nor prev percent or operator
		      if (i !== 0 && !inFn && parts[i-1].type !== "Percentage" && part.type !== "Operator")
		        len++;

		      if (part.type === "Dimension")
		        len += part.val.length + part.unit.length;
		      else if (part.type === "Number")
		        // val also includes potential epsilon
		        len += part.val.length;
		      else if (part.type === "Percentage")
		        len += part.val.length + 1;
		      else if (part.type === "Identifier")
		        len += part.name.length;
		      else if (part.type === "Operator")
		        len += 3;
		      else if (part.type === "Function") {
		        len += part.name.length + 2;
		        walk(part.arguments, true);
		      }
		      // delim? val.length
		    });
		  }

		  return len
		}



		/**
		 * Get the predicted length of several declarations
		 * when minified.
		 */
		function getLengthOfAllDeclarations(declarations) {
		  return declarations.reduce((len, decl) => len + getDeclarationLen(decl))
		}



		/**
		 * Gets the length of a selector pattern
		 * when printed as a optimized minified string.
		 * We only care for one item in the sel list.
		 * If run AFTER mangling it will use those values instead.
		 * So if mangling of selector (class/id) is enabled, need to
		 * run this fn AFTER mangling.
		 */
		function getSelectorLen(selector) {
		  var len = 0;
		  walk(selector);
		  function walk(pattern, complexPattern) {
		    pattern.forEach((sel, i, arr) => {

		      if (i !== 0 && sel.type !== "Combinator" && arr[i-1].type !== "Combinator" && !complexPattern)
		      // first sub selector needs space (+1 len) in complex?
		      // calc like codegen does, if we need space?

		      // and not id && sel.type !== "id" || "class", "attri"?
		      // we do need space after class etc for non complex
		      // but not inside complex. the tree removed spaces
		      // parent
		        // this is dont after, not before though
		        len += 1;

		      if (sel.type === "UniversalSelector")
		        len++;
		      else if (sel.type === "NestingSelector")
		        len++;
		      else if (sel.type === "IdSelector")
		        len += sel.name.length + 1;
		      else if (sel.type === "ClassSelector")
		        len += sel.name.length + 1;
		      else if (sel.type === "TagSelector")
		        len += sel.name.length;
		      else if (sel.type === "Combinator")
		        len++;
		      else if (sel.type === "AttributeSelector") {
		        len += 2 + sel.name.name.length;
		        if (sel.operator) len += sel.operator.length;
		        if (sel.value === "Identifier") len += sel.value.name.length;  // if op, there has to be a value?
		        if (sel.value === "String") len += sel.value.val.length + 2;
		        if (sel.flag) len += sel.flag.name.length;                     // s or i
		        if (sel.value === "Identifier" && sel.flag.name) len++;        // add space if flag and ident (not needed for string)
		      }
		      else if (sel.type === "PsuedoElementSelector")
		        len += sel.name.length + 2;
		      else if (sel.type === "PseudoClassSelector")
		        len += sel.name.length + 2;
		      else if (sel.type === "ComplexSelector") {
		        if (i !== 0) len++;                                            // add space at start of ComplexSel (unless its first), since if above dont add for first node in arr
		        walk(sel.selectors, true);
		      }
		      throw new Error("Unknown type when calling 'getSelectorLen'")
		    });
		  }

		  return len
		}


		/**
		 * a is longer than b if >= (larger or same size).
		 */
		function isLonger(a, b) {
		  return getSelectorLen(a) > getLengthOfAllDeclarations(b)
		}

		// removes a node, regardless of its position in the ast (via key or index)
		/**
		 * Removes a node from the ast.
		 * Whether it is in an object or array. (is an obj prop/stringed key, or in an array/indexed key, both are objects/always a obj node)
		 * Lots of decisions are made each time we
		 * remove a node, so inefficient algo.
		 */
		function removeNode(node, key, index) {
		  Array.isArray(node[key])
		    ? node[key].splice(index, 1)
		    : delete node[key];
		}


		function getProperty(property, declarations, start) {
		  for (var i = start || 0; i < declarations.length; i++)
		    if (declarations[i].property === property)
		      return { declaration: declarations[i], index: i }
		  return { declaration: null, index: -1}
		}


		function allPropertyValuesSame(arr) {
		  arr[0].type;
		  // skip first, then compare all values to the first, they must all be the same
		  for (var i = 1; i < arr.length; i++)
		    if (!sameValueExact(arr[0], arr[i])) return false
		  return true
		}


		// check if two nodes, representing css values, are equal.
		// if the node type is not recognized, returns true.
		function sameValueExact(a, b) {
		  var type = a.type;

		  // after this point we can assume both a and b has same type
		  if (a.type !== b.type) return false

		  if (type === "Dimension") {
		    if (a.val !== b.val || a.unit !== b.unit)
		      return false
		  }
		  else if (type === "Number") {
		    if (a.val !== b.val)
		      return false
		  }
		  else if (type === "Percentage") {
		    if (a.val !== b.val)
		      return false
		  }
		  else if (type === "Function") {
		    if (!isFunctionSame(a, b)) // correct a and b?
		      return false
		  }
		  // keywords (e.g. auto) or variablename (e.g. --darkred) only valid as value/fn arg
		  else if (type === "Identifier") {
		    if (a.name !== b.name)
		      return false
		  }

		  return true
		}


		// determines if two functions (calc(20px + 30px)) are exactly the same visually
		function isFunctionSame(a, b) {
		  // console.log(a, b);
		  // validate name and length. validate length so a: calc(20px), b: calc(20px + 20px) isnt true below
		  if (a.name !== b.name || a.arguments.length !== b.arguments.length) return false

		  for (var i = 0; i < a.arguments.length; i++) {
		    console.log(a.arguments[i].type, b.arguments[i].type);

		    // if a is ListSeparator, b need to be too
		    if (a.arguments[i].type === "ListSeparator" && a.arguments[i].type !== "ListSeparator") // use parser.ListSeparator? nodetypes.js to easily change for all occurences of use?
		      return false

		    // list is one val, but operator can be many, so need to check same val
		    else if (a.arguments[i].type === "Operator" && (b.arguments[i].type !== "Operator" || a.arguments[i].val !== b.arguments[i].val))
		      return false

		    // is it arguments.value.parts?
		    else if (!sameValueExact(a.arguments[i], b.arguments[i]))
		      return false
		  }

		  return true
		}


		function hasAllLonghandProps(found) {
		  if (found.length !== this.order.length) return false

		  for (var prop of this.order) {
		    if (!found.includes(prop))
		      return false
		  }
		}


		// gets the value of an rgb or rgba function
		// rgb(2, 2, 2)
		// rgb(2 2 2)
		// rgb(2 2 2 / 50%)
		// rgb(2, 2, 2, 50%)
		function getRGBValues(args) { // fn
		  var values = [];
		  for (arg of args) {
		    if (arg.type === "Number" || arg.type === "Percent")
		      values.push(Number(arg.val));
		  }
		  return values
		}


		// does not ws
		function getDeclarationLen() {

		}



		treeUtil = {
		  optimizeValueAmount,
		  optimizeValueOrder,
		  removeOverridenDeclarations,
		  removeOverridenLonghands,
		  shortenLongHands,
		  mergeDuplicateSelectors,
		  getExprParts,
		  isSelectorList,
		  isLonger,
		  removeNode,
		  getProperty,
		  allPropertyValuesSame,
		  sameValueExact,
		  hasAllLonghandProps,
		  nodesAreTypes,
		  getRGBValues,
		  getGrandparent
		};
		return treeUtil;
	}

	var optimize;
	var hasRequiredOptimize;

	function requireOptimize () {
		if (hasRequiredOptimize) return optimize;
		hasRequiredOptimize = 1;
		const { traverseParent } = requireTraverse();
		const { createNameGenerator, makeMangledNameMap } = requireMangle();

		const Inferrer = requireInfer();

		const {
		  createDimensionNode,
		  createHexNode,
		  createStatementNode,
		  createNumberNode,
		  createIdentifierNode,
		  createStringNode,
		  createQuotelessUrlNode
		} = requireNodes();

		const {
		  canShortenHex,
		  attemptShortenHex,
		  RGBToHex,
		  attemptMakeHex,
		  attemptMakeColorName,
		  trimRedundantZeros,
		  convertExprToRPN,
		  evaluateVariableLengthExpression,
		  replaceNodeAt,
		  removeNodeAt,
		  shallowCopy,
		  makeMultiKeyMap
		} = requireUtil();

		const {
		  optimizeValueAmount,
		  optimizeValueOrder,
		  removeOverridenDeclarations,
		  removeOverridenLonghands,
		  shortenLongHands,
		  mergeDuplicateSelectors,
		  getExprParts,
		  isLonger,
		  nodesAreTypes,
		  getRGBValues,
		  getGrandparent
		} = requireTreeUtil();

		const {
		  isRGB,
		  isPlainDeclarationValue,
		  isCustomProperty,
		  isVariableRef,
		  isUrl,
		  isBinaryCalcFunction,
		  isInterchangableStringAndUrlContext,
		  isAnimationNamePermissibleProperty,
		  isEmpty,
		  isDatatypeDependantShorthandProp,
		  isOrderDependantShorthandProp
		} = requirePreds();


		optimize = function optimize(ast, config) {
		  console.log("Optimizing code");

		  var inferrer = new Inferrer(ast, config);
		  var { varManager, mangledCustomProps, mangledNamespaceMap, mangledKeyframesMap } = inferrer.infer();
		  var inKeyframe = false;
		  var selectorMangler =
		    isEmpty(config.preMangledNames.selectors)
		      ? makeMangledNameMap()
		      : makeMangledNameMap(config.preMangledNames.selectors);

		  traverseParent(ast, {
		    ////////////////////////////////////////////////
		    KeyframesRule: {
		      enter(kfNode, parent, index, selPattern, arr, key) {
		        inKeyframe = true;
		      },
		      exit(kfNode, parent, index, selPattern, arr, key) {
		        inKeyframe = false;

		        if (config.removeEmptyAtRules && kfNode.arguments.length === 0) {
		          removeNodeAt(arr, index);
		          return true
		        }
		      }
		    },

		    ////////////////////////////////////////////////
		    MediaQueryList: {
		      exit(node, parent, index, selPattern, arr, key) {
		        if (config.removeEmptyAtRules && node.selectors.length === 0) {
		          removeNodeAt(arr, index);
		          return true
		        }
		      }
		    },

		    ////////////////////////////////////////////////
		    ClassSelector: {
		      enter(node, parent) {
		        if (config.mangleSelectorNames)
		          isEmpty(config.preMangledNames.selectors)
		            ? selectorMangler.mangleName(node)
		            : selectorMangler.mangleName(node, config.preMangledNames.selectors);
		      }
		    },

		    ////////////////////////////////////////////////
		    IdSelector: {
		      enter(node, parent) {
		        if (config.mangleSelectorNames)
		          isEmpty(config.preMangledNames.selectors)
		            ? selectorMangler.mangleName(node)
		            : selectorMangler.mangleName(node, config.preMangledNames.selectors);
		      }
		    },

		    ////////////////////////////////////////////////
		    SelectorPattern: {
		        enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
		          // if (config.mergeIdenticalStyleRules && parent.type !== "Scope")
		          //   mergeDuplicateSelectors(node, visitedSelectorPatterns, parent)
		        },
		        exit(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
		          if (parent.type !== "Scope") {
		            visitedSelectorPatterns.push({
		              selectorPattern: node,
		              styleRule: parent,
		              arr,
		              parentArr,
		              ancestors
		            });
		          }
		        }
		      },

		      ////////////////////////////////////////////////
		      StyleRule: {
		        enter(node, parent, index, selPattern, arr, key) {
		          var declarations = node.rules.declarations;

		          if (declarations.length === 0 && config.removeEmptyStyleRules) {
		            removeNodeAt(arr, index);
		            return true
		          }

		          // if, e.g., two width declarations in the same stylerule, only need to keep the last
		          if (config.removeOverridenDeclarations) {
		            return removeOverridenDeclarations(node, declarations)
		          }

		          // all longshands before its shorthand will be overwritten by the shorthand and is therefore redundant
		          if (config.longhandToShorthand) {
		             shortenLongHands(node);
		          }
		        },
		        exit(node, parent, index, selPattern, arr, key) {
		          if (config.removeEmptyStyleRules && node.rules.declarations.length === 0) {
		            removeNodeAt(arr, index);
		            return true
		          }
		        }
		      },

		      ////////////////////////////////////////////////
		      Declaration: {
		        enter(node, parent, index, prevSelPatterns, arr, parentArr, ancestors) {

		          if (inKeyframe && node.important === true && !config.keepImportantInKeyframes) {
		            // config.keepKeyframeImportantDeclarations - removeInvalidKeyframeDeclarations
		            removeNodeAt(parent.declarations, index);
		            return true
		          }

		          if (config.optimizeShorthandProperties) {
		            // if prop is e.g. margin. check if we can use fewer values then currently to achieve the same semantics.
		            // e.g. margin: 20px 20px; -> margin: 20px;
		            if (isOrderDependantShorthandProp(node.property)) {
		              optimizeValueAmount(node.value.parts);
		            }

		            // if property (border, font, background) that cares about the _type_ of the values, and not _order_ of the values
		            // (e.g. border: 1px solid red; and border: red 1px solid; are both valid), re-arranges the values to require the fewest delimiters,
		            // e.g. border: #000 1px solid; -> border:1px#000 solid;
		            if (isDatatypeDependantShorthandProp(node.property)) {
		              optimizeValueOrder(node.value.parts);
		            }
		          }

		          // if you mangle keyframe names, you need to update the animation props value since it can ref the keyframe name
		          if (isAnimationNamePermissibleProperty(node) && config.mangleKeyframeNames) {
		            node.value.parts.forEach((part) => {
		              if (part.type === "Identifier")
		                if (config.preMangledNames.keyframes[part.name])
		                  part.name = config.preMangledNames.keyframes[part.name];
		                else if (mangledKeyframesMap[part.name])
		                  part.name = mangledKeyframesMap[part.name];
		            });
		          }

		          if (isCustomProperty(node) && config.mangleVariables && !config.resolveVariables)
		            if (mangledCustomProps[node.property])
		              node.property = mangledCustomProps[node.property];
		            else if (config.preMangledNames.variables[node.property])
		              node.property = config.preMangledNames.variables[node.property];
		        },
		        exit(node, parent, index) {
		          if (node.value.parts.length === 0) {
		            removeNodeAt(parent.declarations, index);
		            return true
		          }
		        }
		      },

		      ////////////////////////////////////////////////
		      QuotelessUrl: {
		        enter(node, parent) {
		          // ql can have whitespaces before and after it. always trim for opti.
		          // if url(ql) -> str opti is done below, we also need the string to not have any whitespaces.
		          node.val = node.val.trim();

		          if (isInterchangableStringAndUrlContext(parent))
		            // url(ql) -> str
		            parent.url = createStringNode(node.val, "'");
		        }
		      },

		      ////////////////////////////////////////////////
		      NamespaceRule: {
		        enter(node) {
		          if (config.mangleNamespaceNames) {
		            if (isEmpty(config.preMangledNames.namespaces)) {
		              if (node.prefix && mangledNamespaceMap[node.prefix.name])
		                node.prefix.name = mangledNamespaceMap[node.prefix.name];
		            }
		            else {
		              if (node.prefix && config.preMangledNames.namespaces[node.prefix.name])
		                node.prefix.name = config.preMangledNames.namespaces[node.prefix.name];
		            }
		          }
		        }
		      },

		      ////////////////////////////////////////////////
		      // identify namespace reference by the separator
		      NamespacePrefixSeparator: {
		        enter(node, parent, index, _, siblings) {
		          if (config.mangleNamespaceNames)
		            if (!isEmpty(config.preMangledNames.namespaces))
		              siblings[index-1].name = config.preMangledNames.namespaces[siblings[index-1].name];
		            else if (mangledNamespaceMap[siblings[index-1].name])
		              siblings[index-1].name = mangledNamespaceMap[siblings[index-1].name];
		        }
		      },

		      ////////////////////////////////////////////////
		      Function: {
		        enter(node, parent, currNodeIndex, visitedSelectorPatterns, arr, parentArr, ancestors) {
		          if (isVariableRef(node)) {
		            if (config.mangleVariables && !config.resolveVariables) {
		              if (mangledCustomProps[node.arguments[0].name]) {
		                node.arguments[0].name = mangledCustomProps[node.arguments[0].name];
		                // also remove fallback values. if mangle name, we know var exists, so fallback will never be needed
		                node.arguments = [node.arguments[0]];
		              }
		              else if (config.preMangledNames.variables[node.arguments[0].name]) {
		                node.arguments[0].name = config.preMangledNames.variables[node.arguments[0].name],
		                node.arguments = [node.arguments[0]];
		              }
		            }
		            else if (config.resolveVariables) {
		              if (varManager.hasDeclaration(node))
		                return varManager.resolveSafeRef(node, parent, currNodeIndex)

		              if (node.arguments.length <= 2) {
		                removeNodeAt(parent.parts, currNodeIndex);
		                return true
		              }
		              else if (node.arguments.length > 2) {
		                var args = node.arguments.slice(2);
		                replaceNodeAt(parent.parts, currNodeIndex, args);
		                return true
		              }
		            }
		          }

		          if (isUrl(node)) {
		            if (isInterchangableStringAndUrlContext(parent))
		              // url(str) -> string
		              parent.url = createStringNode(node.arguments[0].val, node.arguments[0].delimiter);
		            // fine grain over time, so it can also go from url(str) to str sometimes in decl context aswell
		            else if (isPlainDeclarationValue(parent, getGrandparent(ancestors)))
		              // this can make an incorrect string, correct
		              // url(str) -> url(ql)
		              replaceNodeAt(parent.parts, currNodeIndex, createQuotelessUrlNode(node.arguments[0].val, node.name));

		            return
		          }

		          if (isRGB(node) && config.useShortestColorValue) {
		            // hex (#ffaadd10)(9) always shorter than rgb(0,0,0,1)(12), so always convert if rgb
		            var values = getRGBValues(node.arguments);
		            var hex = attemptShortenHex(RGBToHex(...values));
		            replaceNodeAt(parent.parts, currNodeIndex, createHexNode(hex));
		          }

		          if (isBinaryCalcFunction(node) && config.resolveExpressions) {
		            var evalSafeNodes = nodesAreTypes(node.arguments, "Dimension", "Operator");

		            if (evalSafeNodes) {
		              const parts = getExprParts(node.arguments);
		              const rpn = convertExprToRPN(parts);
		              const val = evaluateVariableLengthExpression(rpn);

		              // make single value
		              parent.parts = [];
		              parent.parts.push(createDimensionNode(val, "px"));
		            }
		          }
		        }
		      },

		      ////////////////////////////////////////////////
		      Identifier: {
		        enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
		          console.log(ancestors[ancestors.length-3]);
		          if (config.useShortestColorValue && isPlainDeclarationValue(parent, getGrandparent(ancestors))) {

		            // attempt to convert the colorname to (the shortest) hex
		            var newColor = attemptMakeHex(node.name);

		            // remove lowercase for BOTH? never one
		            if (newColor.toLowerCase() !== node.name.toLowerCase()) {
		              replaceNodeAt(parent.parts, index, createHexNode(newColor));
		            }
		          }
		        }
		      },

		      ////////////////////////////////////////////////
		      Hex: {
		        enter(node, parent, index, visit, siblings) {
		          // if hex has alpha we dont do anything. converting to colorname would loose the alpha data,
		          // and we can't shorten either because alpha hex must be 8 characters long
		          if (node.val.length === 8) return

		          if (config.useShortestColorValue && isPlainDeclarationValue(parent)) {
		            var newColor = attemptMakeColorName(node.val);

		            if (newColor.toLowerCase() !== node.val.toLowerCase()) {
		              replaceNodeAt(parent.parts, index, createIdentifierNode(newColor));
		              return
		            }
		          }

		          // if reach here, not a hex with alpha nor a colorname, but the user written hex,
		          // which can be either 3 or 6. if 6, we try to shorten.
		          if (node.val.length === 6 && canShortenHex(node.val)) {
		            return node.val = node.val[0] + node.val[2] + node.val[4]
		          }
		        }
		      },

		      ////////////////////////////////////////////////
		      Percentage: {
		        enter(node, parent, index) {
		          if (config.skipTrailingZero)
		            node.val = trimRedundantZeros(node.val);

		          // removes 0(px)
		          if (config.removeExcessUnits && node.val === "0")
		            // Value
		            if (parent.parts)
		              replaceNodeAt(parent.parts, index, createNumberNode(0));
		            // Function
		            else if (parent.arguments)
		              replaceNodeAt(parent.arguments, index, createNumberNode(0));
		        }
		      },

		      ////////////////////////////////////////////////
		      Number: {
		        enter(node) {
		          if (config.skipTrailingZero)
		            node.val = trimRedundantZeros(node.val);
		        }
		      },

		      ////////////////////////////////////////////////
		      Dimension: {
		        enter(node, parent, index) {
		          // removes 0.1(00)
		          if (config.skipTrailingZero)
		             node.val = trimRedundantZeros(node.val);

		          // removes 0(px)
		          if (config.removeExcessUnits && node.val === "0")
		            // Value
		            if (parent.parts)
		              replaceNodeAt(parent.parts, index, createNumberNode(0));
		            // Function
		            else if (parent.arguments)
		              replaceNodeAt(parent.arguments, index, createNumberNode(0));

		          // leading zeros, (000)1, auto removed by JS
		        }
		      }
		  });

		  return {
		    ast,
		    map: {
		      keyframes:  mangledKeyframesMap,
		      variables:  mangledCustomProps,
		      namespaces: mangledNamespaceMap,
		      selectors:  selectorMangler.getMangledNames()
		    }
		  }
		};
		return optimize;
	}

	var codeGenerator;
	var hasRequiredCodeGenerator;

	function requireCodeGenerator () {
		if (hasRequiredCodeGenerator) return codeGenerator;
		hasRequiredCodeGenerator = 1;
		const { traverseParent } = requireTraverse();

		codeGenerator = function generateCode(ast, config) {
		  console.log("Generating code");
		  var output      = "";
		  var inKeyframe  = false;
		  var inMedia     = false;

		  var visitors = {
		    QuotelessUrl: {
		      enter(node, parent, index, _, siblings) {
		        isImportUrl(parent) || (prevSiblingIsDelimValue(siblings, index) && !isNamespaceUrl(parent)) ?
		          // import (already adds ws) or decl behind delim
		          add(node.name+"("+node.val+")") :
		          // namespace, decl
		          add(" " + node.name+"("+node.val+")");
		          // if import dont add. also want b always for import
		      }
		    },
		    ImportRule: {
		       enter(node, parent, idx, selPattern, arr, key) {
		         add(node.url.type === "String" ? "@import" : "@import ");
		       },
		       exit(node, parent, idx) {
		         add(";");
		       }
		    },
		    FontPaletteValuesRule: {
		      enter() {
		        add("@font-palette-values ");
		      }
		    },
		    FontFaceRule: {
		      enter() {
		        add("@font-face ");
		      }
		    },
		    LayerRule: {
		      enter() {
		        add("@layer ");
		      },
		      exit(node) {
		        if (node.rules.length === 0)
		          node.hasEmptyBlock
		            ? add("{}")
		            : add(";");
		      }
		    },
		    StyleRule: {
		      enter(node, parent, index) {
		        if ((parent.type === "LayerRule" || parent.type === "ScopeRule") && index === 0)
		          add("{");
		      },
		      exit(node, parent, index) {
		        if ((parent.type === "LayerRule" || parent.type === "ScopeRule") && index === parent.rules.length-1) {
		          add("}");
		          return
		        }
		      }
		    },
		    ScopeRule: {
		      enter(node) {
		        add("@scope");
		      }
		    },
		    Scope: {
		      enter(node, parent, idx) {
		        add("(");
		      },
		      exit() {
		        add(")");
		      }
		    },
		    SelectorPattern: {
		      exit(node, parent, idx) {
		        if (!lastSelectorPattern(parent, node))
		          add(",");
		      }
		    },
		    Comment: {
		      enter(node, parent) {
		        add(node.val);
		      },
		    },
		    NamespaceRule: {
		      enter() {
		        add("@namespace");
		      },
		      exit() {
		        add(";");
		      }
		    },
		    CounterStyleRule: {
		      enter() {
		        add("@counter-style ");
		      }
		    },
		    ViewportRule: {
		      enter() {
		        add("@viewport");
		      }
		    },
		    DocumentRule: {
		      enter() {
		        add("@document ");
		      }
		    },
		    ContainerRule: {
		      enter() {
		        add("@container");
		      }
		    },
		    ContainerCondition: {
		      enter() {
		        add("(");
		      },
		      exit() {
		        add(")");
		      }
		    },
		    ColorProfileRule: {
		      enter() {
		        add("@color-profile ");
		      }
		    },
		    PropertyRule: {
		      enter() {
		        add("@property ");
		      }
		    },
		    FontFeatureValuesRule: {
		      enter() {
		        add("@font-feature-values");
		      },
		    },
		    Feature: {
		      enter(node) {
		        add("@"+node.name);
		      }
		    },
		    PageRule: {
		      enter(node) {
		        add("@page");
		      }
		    },
		    SupportsRule: {
		      enter(node) {
		        add("@supports");
		      }
		    },
		    CharsetRule: {
		      enter(node, parent) {
		        // due to charsets archaic syntax it can ONLY have the path as a
		        // double quoted string, and there HAS to be a space after "@charset"
		        add(`@charset `);
		      },
		      exit(node, parent) {
		        add(";");
		      }
		    },
		    KeyframesRule: {
		      enter(node, parent) {
		        add(`@keyframes ${node.name.name}{`);
		        inKeyframe = true;
		      },
		      exit(node, parent) {
		        add(`}`);
		        inKeyframe = false;
		      }
		    },
		    MediaQueryList: {
		      enter(node, parent) {
		        add("@media");
		        inMedia = true;
		      },
		      exit(node, parent) {
		        add("}");
		        inMedia = false;
		      }
		    },
		    MediaRule: {
		      exit(node, parent, idx) {
		        lastMediaQuery(parent)
		          ? add("{")
		          : add(",");
		      }
		    },
		    MediaFeature: {
		      enter(node, parent) {
		        add("(");
		      },
		      exit(node, parent) {
		        add(")");
		      }
		    },
		    Block: {
		      enter(node, parent) {
		        add("{");
		      },
		      exit(node, parent) {
		        add("}");
		      }
		    },
		    Declaration: {
		      enter(node, parent) {
		        add(inKeyframe || inMedia ? node.property + ":" : node.property + ":");
		      },
		      exit(node, parent) {
		        add(node.important ? "!important;" : ";");
		      }
		    },
		    TagSelector: {
		      enter(node, parent, idx, a, b, c, ancestors) {
		        var noSpace = isFirstNonPageRuleSelector(ancestors, idx) ||
		                      prevSiblingIsCombinator(parent, idx);
		        add(node.name, !noSpace);
		      }
		    },
		    ClassSelector: {
		      enter(node, parent, idx, a, b, c, ancestors) {
		        var noSpace = !selectorIsBehindDelimiter(parent, idx);
		        add("." + node.name, noSpace);
		      }
		    },
		    IdSelector: {
		      enter(node, parent, idx, a, b, c, ancestors) {
		        var noSpace = !selectorIsBehindDelimiter(parent, idx);
		        add("#" + node.name, noSpace);
		      }
		    },
		    UniversalSelector: {
		      enter(node, parent, idx, a, b, c, ancestors) {
		        var noSpace = !selectorIsBehindDelimiter(parent, idx);
		        add(node.name, noSpace);
		      }
		    },
		    ComplexSelector: {
		      enter(node, parent, index, selPattern, arr, parentArr, ancestors) {
		        var noSpace = isFirstSelectorInPatternOrPrevSiblingIsCombinator(parent, index);

		        if (isFirstSelectorAndInPageRule(ancestors, index))
		          add(" ");

		        add(noSpace ? "" : " ");
		      }
		    },
		    AttributeSelector: {
		      enter(node, parent, idx, a, b, c, ancestors) {
		        var noSpace = !selectorIsBehindDelimiter(parent, idx);
		        add("[", noSpace);
		      },
		      exit(node, parent) {
		        add("]");
		      }
		    },
		    PsuedoElementSelector: {
		      enter(node, parent, idx, a, b, c, ancestors) {
		        var noSpace = !selectorIsBehindDelimiter(parent, idx);
		        add("::" + node.name, noSpace);
		      }
		    },
		    PseudoClassSelector: {
		      enter(node, parent, idx, a, b, c, ancestors) {
		        var noSpace = isFirstNonPageRuleSelector(ancestors, idx) ||
		                      prevSiblingIsCombinator(parent, idx);
		        add(":" + node.name, !noSpace);
		      }
		    },
		    NamespacePrefixSeparator: {
		      enter(node) {
		        // either | or |*
		        add(node.val);
		      }
		    },
		    Combinator: {
		      enter(node, parent) {
		        add(node.name);
		      }
		    },
		    Function: {
		      enter(node, parent, index, selPattern, siblings, key) {
		        var noSpace = isImportUrl(parent) || !hasSiblings(siblings) || index === 0 || isValueEndingWithDelim(siblings[index-1]);
		        var space = isNamespaceUrl(parent) ? " " : "";
		        add(noSpace ? space + node.name + "(" : " " + node.name + "(");
		      },
		      exit(node, parent) {
		        add(")");
		      }
		    },
		    // Whitespace: {
		    //   enter(node) {add(node.val)}
		    // },
		    Identifier: {
		      enter(node, parent, index, selPattern, siblings) {
		        if (isScopeRuleSelector(parent)) {
		          add(node.name);
		          return
		        }

		        // if identifier is inside a MediaFeature - and its on the left side of :
		        if (isMediaFeatureProperty(parent)) {
		          add(parent.val.type === "Identifier" ? node.name + ":" : node.name + ":");
		          // make more sense to add the : in MediaFeature: {} visitor? in it, just read both props (prop, val) and add if not null
		          return
		        }

		        if (isAfterAtRuleKeyword(parent, index)) {
		          add(" " + node.name);
		          return
		        }

		        // path.next(), dontSkip() - for opti (diff traversers), but also so dont have to return values to tell outer fn what to do. outer fn gives the options as arg
		        // path.prevSibling - have it better prepare the data it already passes. add to a single object, so not so many args with _
		        // preds, what other fns -   // predicates also then better? but we never know if all parser users need them?
		        // traverse obj that has fn, can set its state instead of pass path? inKeyframe etc?

		        // forEach(next) - does current check if deleted element?

		        // always add " "
		        // when not to? see all the times we dont want too. dont detect when
		        // !isImportUrl add

		        if (isFontFeature(parent)) {
		          let noSpace = prevSiblingIsListSepOrString(siblings, index);
		          add(node.name, noSpace);
		          return
		        }

		        if (isNamespacePrefix(parent, node)) {
		          add(" " + node.name);
		          return
		        }

		        isFunctionArgument(parent)
		          ? add(parent.type === "Value" && parent.arguments.indexOf(node) !== 0  || parent.type === "MediaRule" || isImportUrl(parent) ? " " + node.name : node.name)
		          : add(!prevSiblingIsDelimValue(siblings, index) || parent.type === "MediaRule" || isImportUrl(parent) ? " " + node.name : node.name);
		      }
		    },
		    Dimension: {
		      enter(node, parent, index, selPattern, siblings) {
		        var noSpace = prevSiblingIsDelimValue(siblings, index);
		        add(node.val + node.unit, !noSpace);
		      }
		    },
		    Number: {
		      enter(node, parent, index, selPattern, siblings) {
		        var noSpace = prevSiblingIsDelimValue(siblings, index);
		        add(node.val, !noSpace);
		      }
		    },
		    String: {
		      enter(node, parent) {
		        if (parent && parent.operator) add(parent.operator);

		        add(isImportUrl(parent) ?
		              `${node.delimiter + node.val + node.delimiter}` : // why does import need space after?

		                (parent.type === "Value" ?
		                    `${node.delimiter}` + node.val + `${node.delimiter}` :
		                    `${node.delimiter}` + node.val + `${node.delimiter}`));
		      }
		    },
		    Percentage: {
		      enter(node, parent, index, _, siblings) {
		        var noSpace = prevSiblingIsDelimValue(siblings, index);
		        add(node.val + "%", !noSpace);
		      },
		    },
		    Hex: {
		      enter(node, parent) {
		        // check if hex in:
		        // @font-palette-values --Alternate {
		        // font-family: "Bungee Spice";
		        // override-colors:
		          // 0 #00ffbb,
		          // 1 #007744;
		        // }
		        // needs space.
		        add("#" + node.val);
		      }
		    },
		    Operator: {
		      enter(node, parent) {
		        // operator is a Value. next sibling will add space after operator.
		        add(" " + node.val);
		      }
		    },
		    ListSeparator: {
		      enter() {
		        add(",");
		      }
		    },
		    Unknown: {
		      enter(node, parent) {
		        if (node.token.type === "String")
		          add(`${node.token.delimiter}` + node.token.val + `${node.token.delimiter}`, true);
		        else
		          add(node.token.val, true);
		      }
		    },
		    NestingSelector: {
		      enter() {
		        add("&");
		      }
		    },
		    StartingStyleRule: {
		      enter(node) {
		        add("@starting-style");
		        if (node.rules[0].type !== "Block")
		          add("{");
		      },
		      exit(node) {
		        if (node.rules[0].type !== "Block")
		          add("}");
		      }
		    }
		  };

		  function add(str, noSpace) {
		    output += (noSpace ? " " + str : str);
		  }

		  function isValueEndingWithDelim(node) {
		    // we dont consider dimension (px, rem etc) delim value. SHL and AI seem to indicate that it isnt ok to skip space between them.
		    // check spec. so for now: 'margin:20px 10px;'
		    return node.type === "Percentage"    ||
		           node.type === "ListSeparator" ||
		           node.type === "String"        ||
		           node.type === "Function"      ||
		           node.type === "QuotelessUrl"  ||
		           node.type === "Condition"
		           // mediafeature?
		           // isValueDelim
		  }

		  function isScopeRuleSelector(parent) {
		    return parent.type === "ScopeRule"
		  }

		  function prevSiblingIsDelimValue(siblings, index) {
		    // have isSiblings as own check. the req to do nospace? need to set "" default? or else add(val)
		    return !hasSiblings(siblings) || index === 0 || isValueEndingWithDelim(siblings[index-1])
		  }

		  function isAfterAtRuleKeyword(parent, index) {
		    return parent.type === "ContainerRule" && index === 0  // siblingNum. siblingIdx
		    // expand
		  }

		  // need to exclude if in PageRule here too?
		  function selectorIsBehindDelimiter(node, idx) { // isSelectorDelim selectorIsAlsoDelim
		     return node.type === "ComplexSelector" ||
		            // check index only if not inside complex
		            idx === 0 ||
		            // pass siblings. node.arr. then it doesnt assume node can only be in an array called selectors
		            // assume selectors if arg not set?
		            node.selectors[idx-1].type === "Combinator" ||
		            node.selectors[idx-1].type === "NamespacePrefixSeparator"
		  }

		  // firstSelectorOrBehindCombinator
		  function isFirstSelectorInPatternOrPrevSiblingIsCombinator(parent, index) {
		    return index === 0 || parent.selectors[index-1].type === "Combinator" || parent.selectors[index-1].type === "NamespacePrefixSeparator"
		  }

		  // first in its selectorPattern, and stylerule is in pagerule
		  function isFirstNonPageRuleSelector(ancestors, idx) {
		    return (idx === 0 && ancestors[ancestors.length-4].type !== "PageRule")
		  }

		  function isFirstSelectorAndInPageRule(ancestors, idx) {
		    return (idx === 0 && ancestors[ancestors.length-4].type === "PageRule")
		  }

		  function prevSiblingIsCombinator(parent, idx) {
		    return (idx !== 0 && parent.selectors[idx-1].type === "Combinator") || parent.selectors[idx-1].type === "NamespacePrefixSeparator"
		  }

		  function prevSiblingIsListSepOrString(siblings, index) {
		    return index !== 0 && (siblings[index-1].type === "ListSeparator" || siblings[index-1].type === "String")
		  }

		  function lastSelectorPattern(parent, node) {
		    return parent.selectors.indexOf(node) === parent.selectors.length-1
		  }

		  function lastMediaQuery(parent) {
		    return parent.queries.indexOf(node) === parent.queries.length-1
		  }

		  function isFontFeature(parent) {
		    return parent.type === "FontFeatureValuesRule"
		  }

		  function isMediaFeatureProperty(parent) {
		    return parent.type === "MediaFeature" && parent.prop === node
		  }

		  function isFunctionArgument(parent) {
		    return parent.type === "Function"
		  }

		  function isImportUrl(parent) {
		    return parent.type === "ImportRule"
		  }

		  function isNamespaceUrl(parent) {
		    return parent.type === "NamespaceRule"
		  }

		  function isNamespacePrefix(parent, node) {
		    return parent.type === "NamespaceRule" && node === parent.prefix
		  }

		  function hasSiblings(siblings) {
		    return Array.isArray(siblings) && siblings.length > 0
		  }

		  traverseParent(ast, visitors);
		  return output
		};
		return codeGenerator;
	}

	var src;
	var hasRequiredSrc;

	function requireSrc () {
		if (hasRequiredSrc) return src;
		hasRequiredSrc = 1;
		const parse    = requireParser();
		const optimize = requireOptimize();
		const print    = requireCodeGenerator();

		src = function compile(css, config) {
		  const ast  = parse(css, config);
		  const opti = optimize(ast, config);
		  const min  = print(opti.ast, config);

		  return {
		    css: min,
		    map: opti.map
		  }
		};

		// passed to the config, names inside though. assumptions.

		// min config, vs parser/parse config
		// fn, read internal map, assigned to outside? extract the two?

		// user/def config obj/merge outside, apply own here (instead of this fn, assign fn again), works in rest/overrides its own def
		// split 3 obj in outer, pass config.parse, config.opti

		// keep props outside, and always merge into exposed

		// add default config obj for opti and print too?
		return src;
	}

	var WebMin;
	var hasRequiredWebMin;

	function requireWebMin () {
		if (hasRequiredWebMin) return WebMin;
		hasRequiredWebMin = 1;
		WebMin = function minify(css, userConfig) {
		  var { defaultConfig, internalParserConfig } = requireConfig$1();
		  // let user config overwrite default, but internal overwrite user config
		  // res: user can change all exposed configs, but not predefined parser config
		  // have this fn output 3 objects? pass them, then clean and can limit whats passed.
		  // output 2, just for parser.
		  var config = Object.assign(defaultConfig, userConfig, internalParserConfig); // use spread?

		  console.log("minify merged:", config);

		  var compile = requireSrc();
		  return compile(css, config)
		};
		return WebMin;
	}

	var WebMinExports = requireWebMin();
	var index = /*@__PURE__*/getDefaultExportFromCjs(WebMinExports);

	return index;

}));
