exports.Parser = class Parser {
  constructor(tokens, config) {
    this.config = config
    this.tokens = tokens
    this.i = 0
    this.token = this.tokens[this.i]
  }

  next(n, dontSkipSpace, ignoreAssert, steps) {
    this.token = n ?
      this.tokens[this.i = this.i + n] :
      // skips past ws. if multiple in a row, the next next() call will skip past those.
      this.tokens[!dontSkipSpace && this.isWhitespace(this.peek()) ? this.i += 2 : ++this.i]

    if (!ignoreAssert) this.assertEnd()
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

  isEnd() {
    return this.i >= this.tokens.length
    // return this.token === undefined
  }

  assertEnd() {
    if (this.isEnd()) {
      throw new SyntaxError("Unexpected end of input. Unclosed matching delimiter.")
    }
  }

  createLoc(tokenStart, tokenEnd) {
    return {
      start: {
        line: tokenStart
          ? tokenStart.loc.start.line
          : this.token.line,
        col: tokenStart
          ? tokenStart.loc.start.col
          : this.token.start
      },
      end: {
        line: tokenEnd
          ? tokenEnd.line
          : this.token.line,
        col: tokenEnd
          ? tokenEnd.end
          : this.token.end
      }
    }
  }

  finishLoc() {
    return {
      line: this.token.line,
      col: this.token.end
    }
  }
}
