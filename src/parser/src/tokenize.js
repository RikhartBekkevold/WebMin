const tokens = require('./tokens.js');

exports.Tokenizer = class Tokenizer {
  constructor(input, config) {
    this.config = config
    this.input = input
    this.line = 1
    this.pos = 0
    this.tokens = []
    this.curr = 0
    this.char = this.input[0]
    this.firstComment = true
  }


  tokenize() {
    while(this.curr < this.input.length) {

      if (this.isWhitespace()) {
        this.move()
        this.next()
        continue

        // if (this.preserveWhitespace) {
        // CALLED this.config.removeSpace now?
          var pos = this.pos, line = this.line
          let val = ""
          while (this.isWhitespace()) {
            val += this.char
            this.move()
            this.next()
          }
          this.createToken(tokens.whitespace, val, pos)
        // }
        // else {
        //   this.move()
        //   this.next()
        // }
        continue
      }


      if (this.isAsterisk()) {
        this.move()
        this.createToken(tokens.asterisk, this.char, this.pos)
        this.next()
        continue
      }


      if (this.isComment()) {
        var pos = this.pos, line = this.line
        let val = ""
        this.move(2)
        this.next(2)
        while (!this.isCommentEnd()) {
          val += this.char
          this.move(), this.next()
          this.isEnd(line, pos)
        }

        if ((this.config.keepFirstComment && this.firstComment) || !this.config.removeComments) {
          let token = this.createToken(tokens.comment, "/*"+val+"*/", pos)
          token.line = line
          this.firstComment = false
        }

        this.move(2)
        this.next(2)
        continue
      }


      if (this.isDigitStart()) {
        var isEpsilon = false
        var isInt = true
        let num = "", start = this.pos
        var postfix = ""
        num += this.char
        this.move()
        this.next()

        if (this.isDot()) {
          isInt = false
          num += this.char
          this.move()
          this.next()
        }

        while (this.isDigit()) {
          num += this.char
          this.move()
          this.next()

          if (this.isDot()) {
            isInt = false
            num += this.char, this.move(), this.next()

            while (this.isDigit()) {
              num += this.char, this.move(), this.next()

              if (this.isEpsilon()) {
                isEpsilon = true
                num += this.parseEpsilon()
              }
            }
          }

          if (this.isEpsilon()) {
            isEpsilon = true
            num += this.parseEpsilon()
          }
        }

        var token = this.createToken(tokens.number, num, start)
        token.isEpsilon = isEpsilon
        token.isInt = isInt

        if (this.isIdentStart()) {  // || this.char === "-" && this.peek() === "-" || this.char === "-" && this.isIdentStart(this.peek()) {
          let val = ""

          // includes numbers. diff predicate to tokenize 20px20px20px as one value
          while (this.isIdent()) {
            val += this.char
            this.next(), this.move()
          }
          token.type = tokens.dimension
          token.unit = val
        }
        else if (this.isPercent()) {
          token.type = tokens.percentage
          this.next(), this.move()
        }
        continue
      }


      if (this.isOperator() && this.isWhitespace(this.peek())) {
        var start = this.pos
        this.move()
        this.createToken(tokens.operator, this.char, start)
        this.next()
        continue
      }


      if (this.isAttributeOperator()) {
        var start = this.pos
        this.move()
        var token = this.createToken(tokens.attributeOperator, this.char, start)
        this.next()

        if (this.isAttributeOperator()) {
          token.val += this.char
          this.move(), this.next()
        }
        continue
      }


      if (this.isPunctation()) {
        var start = this.pos
        this.move()
        var token = this.createToken(tokens.punctation, this.char, start)
        this.next()
        if (this.char === ":") {
          token.val += ":"
          this.move(); this.next()
        }
        continue
      }


      if (this.isDot() && this.isIdentStart(true)) {
        let val = "", start = this.pos
        this.move()
        this.next()

        while (this.isIdent()) {
          val += this.char
          this.move()
          this.next()
        }
        var token = this.createToken(tokens.class, val, start)
        continue
      }


      if (this.isID()) {
        let name = "", start = this.pos
        this.next()
        this.move()
        while (this.isIdent()) {
          name += this.char
          this.next(), this.move()
        }
        this.createToken(tokens.id, name, start)
        continue
      }


      if (this.isCombinator()) {
        var start = this.pos
        this.move()
        this.createToken(tokens.combinator, this.char, start)
        this.next()
        continue
      }


      if (this.isStringStart()) {
        var delimiter = this.char
        var start = this.pos, line = this.line
        let val = ""
        this.move()
        this.next()
        while (!this.isStringEnd(delimiter)) {
          val += this.char
          this.move(), this.next()
          this.isEnd(line, start) // assertEnd
        }
        this.move()
        this.next()

        let token = this.createToken(tokens.string, val, start)
        token.delimiter = delimiter
        token.line = line

        continue
      }


      if (this.isAtRule()) {
        let type = "", start = this.pos
        this.move()
        this.next()
        while (this.isIdent()) {
          type += this.char
          this.move(), this.next()
        }
        this.createToken(tokens.atRule, type, start)
        continue
      }


      if (this.isIdentStart()) { // || this.char === "-" && this.peek() === "-" || this.char === "-" && this.isIdentStart(this.peek()) ) { // exclude *
        var val = ""
        var start = this.pos

        while (this.isIdent()) { // easy fix to parse as one, so printed witout space
          val += this.char // group concat and move?
          this.move()
          this.next()
        }

        // ws can be inside (, so dont know if " or ' is first char
        // assume url and ( has no space. shl thinks wrong. what about spec?
        // shl indicates url () wrong, so assume no space
        if (this.isQuotelessUrl(val)) {
          var content = ""
          let start = this.pos
          this.move()
          this.next()

          // if missing ) loop is endless (like str), untill gets to end - try it
          // just breaks loop on this.char == undefined? - add isEnd assert?
          // does create token. but move/next after loop fails?
          while (this.char !== ")") {
            content += this.char
            this.move()
            this.next()
          }

          // import media
          this.move()
          this.next()

          let token = this.createToken(tokens.url, content, start)
          token.name = val

          continue
        }

        this.createToken(tokens.ident, val, start)
        continue
      }

      // if not whitespace && !config.keepWhitespace, parseWhitespace, preserveWhitespace
      // dont add delim for whitespace
      // have it go inside so continue..
      this.move() // WRONG? seems wrong to move
      this.createToken(tokens.unknown, this.char, this.pos)
      this.next()
    }

    return this.tokens
  }

  parseEpsilon() {
    var epsilon = ""
    epsilon += this.char, this.move(), this.next()
    if (this.isSign()) epsilon += this.char, this.move(), this.next()
    while (this.isDigit()) epsilon += this.char, this.move(), this.next()
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
    var n = 1
    var char = this.input[this.curr + n]
    while(this.isWhitespace(char))
      char = this.input[this.curr + ++n]
    return this.input[this.curr + n]
  }

  next(n, move) {
    return this.char = n ?
      this.input[this.curr = this.curr + n] :
      this.input[++this.curr]
  }

  move(n) {
    if (this.isNewline()) n ? this.line = this.line + n : this.line++
    n ? this.pos = this.pos + n : this.pos++
    if (this.isNewline()) this.pos = 0
  }

  createToken(type, val, start) {
    var token = {
      type: type,
      val:  val,
      line: this.line,
      start: start,
      end: this.pos
    }
    this.tokens.push(token)
    return token
  }
}
