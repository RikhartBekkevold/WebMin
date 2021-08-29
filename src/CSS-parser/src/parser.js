exports.Parser = class Parser {
  constructor(tokens) {
    this.config = null
    this.tokens = tokens
    this.i = 0
    this.token = this.tokens[this.i]
  }

  next(n, dontSkipSpace, steps) {
    this.token = n ?
      this.tokens[this.i = this.i + n] :
      this.tokens[!dontSkipSpace && this.isWhitespace(this.peek()) ? this.i += 2 : ++this.i]
  }

  peek(firstNonSpace) {
    return firstNonSpace
      ? this.isWhitespace(this.tokens[this.i + 1]) ? this.tokens[this.i + 2] : this.tokens[this.i + 1]
      : this.tokens[this.i + 1]
  }

  expect(token) {
    if (this.token === token)
      throw "Expected " + token + ", instead found" + this.token
  }

  isEnd(line, pos) {
    if (this.i >= this.tokens.length || this.token === undefined) {
      throw new SyntaxError("Unexpected end of input. Starting at line " + line + ":" + pos) // parse erorr. EOF.
    }
  }

  createLoc(tokenStart, tokenEnd) {
    return {
      start: {
        line: tokenStart ? tokenStart.loc.start.line : this.token.line,
        col: tokenStart ? tokenStart.loc.start.col : this.token.start
      },
      end: {
        // we set front as defualt
        line: tokenEnd ? tokenEnd.line : this.token.line,   // this is just copied start.line, becuase we dont save this info
        col: tokenEnd ? tokenEnd.end : this.token.end
      }
    }
  }

  // updateLoc() {
  //
  // }
}
