exports.Parser = class Parser {
  constructor(tokens, config) {
    this.config = config
    this.tokens = tokens
    this.i = 0
    this.token = this.tokens[this.i]
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
      this.tokens[!dontSkipSpace && this.isWhitespace(this.peek()) ? this.i += 2 : ++this.i]
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
      }
    if (isAtom)
      node.loc.end = {
        line: this.token.line,
        col: this.token.end
      }
  }
  // this.updateLoc() - no need to add to a node prop - but need the props to update
  // finish location. just read again the new values.
  maybeFinishLoc(node) {
    if (this.config.addLocationData) {
      node.loc.end = {
        line: this.token.line,
        col: this.token.end
      }
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


}
