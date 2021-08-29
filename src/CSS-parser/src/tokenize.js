exports.Tokenizer = class Tokenizer {
  constructor(input) {
    this.input = input
    this.line = 1
    this.pos = 0
    this.tokens = []
    this.curr = 0
    this.char = this.input[0]
  }


  tokenize(removeComments, ignoreFirstComment) {
    while(this.curr < this.input.length) {

      if (this.isWhitespace()) {
        var pos = this.pos, line = this.line
        let val = ""
        while (this.isWhitespace()) {
          val += this.char
          this.move()
          this.next()
        }
        this.createToken("whitespace", val, pos)
        continue
      }


      if (this.isAsterisk()) {
        this.move()
        this.createToken("asterisk", this.char, this.pos)
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
        let token = this.createToken("comment", "/*"+val+"*/", pos)
        token.line = line
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

        var token = this.createToken("num", num, start)
        token.isEpsilon = isEpsilon
        token.isInt = isInt

        if (this.isIdentStart()) {  // || this.char === "-" && this.peek() === "-" || this.char === "-" && this.isIdentStart(this.peek()) {
          let val = ""
          while (this.isIdent()) {
            val += this.char
            this.next(), this.move()
          }
          token.type = "Dimension"
          token.unit = val
        }
        else if (this.isPercent()) {
          token.type = "Percentage" // lowercase?
          this.next(), this.move()
        }
        continue
      }


      if (this.isOperator() && this.isWhitespace(this.peek())) { // we cant add space after for this one. or we can..? dotn wnt space anyway thouhg
        // how we avoid adding space after? ned to make it belong to num?
        var start = this.pos
        this.move()
        this.createToken("operator", this.char, start) // if can pass callback to move, then we can exe this, since it calls it between next and move
        this.next()
        continue
      }


      if (this.isAttributeOperator()) {
        var start = this.pos
        this.move()
        var token = this.createToken("attributeoperator", this.char, start)
        this.next()

        // this.char === "="
        if (this.isAttributeOperator()) {
          token.val += this.char
          this.move(), this.next()
        }
        continue
      }


      if (this.isPunctation()) {
        var start = this.pos
        this.move()
        var token = this.createToken("punctation", this.char, start)
        this.next()
        if (this.char === ":") {
          token.val += ":"
          this.move(); this.next()
        }
        continue
      }


      // excluded matchs that has digits after - why "-" is legal class name unless escaped
      if (this.isDot() && this.isIdentStart(true)) { // allows - as long as not num after. and disallows nums.
        let val = "", start = this.pos
        this.move()
        this.next()

        while (this.isIdent()) {
          val += this.char
          this.move()
          this.next()
        }
        var token = this.createToken("class", val, start)
        continue
      }


      if (this.isID()) {
        let name = "", start = this.pos
        this.next()
        this.move()
        while (this.isIdent()) { // we assuem ident and no space - check if next is digit? then parse as hex?
          name += this.char
          this.next(), this.move()
        }
        this.createToken("id", name, start) // if id in the parseValues fn, we assume hex/color - we didnt validate valid hex thohg
        continue
      }


      if (this.isCombinator()) {
        var start = this.pos
        this.move()
        this.createToken("combinator", this.char, start)
        this.next()
        continue
      }


      if (this.isStringStart()) {
        var delimiter = this.char
        var start = this.pos, line = this.line
        let val = ""
        this.move()
        this.next()
        while (!this.isStringEnd(delimiter)) { //  || undefined here will result in while edning, and string being the last token
          val += this.char
          this.move(), this.next()
          this.isEnd(line, start) // because the string can be not closed! so need to check for it
          // make is end part of while check. then it will just end, and not throw thouhg. if use = undefined
        }
        this.move()
        this.next()
        // flag or two different tokens
        let token = this.createToken("string", val, start)
        token.delimiter = delimiter // JS auto added slash for us! the = operator?
        token.line = line // override token.line prop. it is set to end line when token created. we switch to saved start line.
        // this values are implicit. closure better?
        continue
      }
      // closure, iffy better since dont need to create instance. static call tokenize? then how we set variables init?
      // use = assignment for class? to create one immedia?

      if (this.isAtRule()) {
        let type = "", start = this.pos
        this.move()
        this.next()
        while (this.isIdent()) {
          type += this.char
          this.move(), this.next()
        }
        this.createToken("@", type, start)
        continue
      }

      if (this.isIdentStart()) { // || this.char === "-" && this.peek() === "-" || this.char === "-" && this.isIdentStart(this.peek()) ) { // exclude *
        var val = "";
        var start = this.pos

        while (this.isIdent()) { // easy fix to parse as one, so printed witout space
          val += this.char
          this.move()
          this.next()
        }

        this.createToken("ident", val, start)
        continue
      }


      this.move() // WRONG? seems wrong to move
      this.createToken("delim", this.char, this.pos)
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


  // needed for strings and tokens. EOF
  // replace with undefined in while, so it doesnt err?
  isEnd(line, pos) {
    // an also do: if undefined? both ending program, or loop with entire as string is ok. becaeu we dont care what fault happens.
    if (this.curr >= this.input.length) { // change so it know which one it is. unclosed "token"?
      throw new SyntaxError("Unexpected end of input. Unclosed comment or string starting at line " + line + ":" + pos);
    }
    // undefined check?
  }

  isStringEnd(type) {
    return this.char === type && this.lookback() !== "\\" // same for commnets? */ must be escaped? both?
    // " '' " will not create a new substring. each char is indivual
  }

  isStringStart() {
    return this.char === '"' || this.char === "'"
  }

  isID() {
    return this.char === "#"
  }

  isDot(char) {
    return char ? char === "." : this.char === "." // dot based on sub paths --- parse subpaths too. context.
  }

  isIdentStart(next) { // n makes more sense that char? unless we pass both
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

  // if we have a char and it has diff meaning in diff context. ALWYAS just parse it as same char, with same generic name
  // and decide in parse its actual meaning. parse = paths = context = meaning.
  isEpsilon() {
    return (this.char === "e" || this.char === "E") && (this.isSign(this.peek()) || this.isDigit(this.peek()))
  }

  isSign(char) {
    return "+-".includes(char ? char : this.char)
  }

  isDigit(char) { // ,n?
    return /[0-9]/.test(char ? char : this.char)
    // return /[0-9]/.test(next ? this.peek() : this.char)
  }

  isPercent() {
    return this.char === "%"
  }

  isNewline() {
    // includes just as good? includes = loop
    return this.char === "\n" ||
    this.char === "\r\n" ||
    this.char === "\r" ||
    this.char === "\f"
  }

  // "\r\n" - "\n\r" both used?
  isWhitespace(char) {
    return /\s/.test(char ? char : this.char) // || this.isNewline() // [\r\n\t\f\v ]
  }

  // isAttributeOperator() {
  //   return (
  //     ((this.char === "$" ||
  //     this.char === "~" ||
  //     this.char === "*" ||
  //     this.char === "^" ||
  //     this.char === "|" ||)
  //     && this.peek() === "=") ||
  //     this.char === "="
  //   )
  // }

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
  // just parse these all as own char, delims, and handle in parse?
  isAsterisk() {
    return this.char === "*" && this.peek() !== "=" // the *= combo constitutes a attribute operator instead
  }

  isAtRule() {
    return this.char === "@"
  }

  // after ident - so uni will be ident
  // - as part of num is before operator, so never becoems operator
  isOperator() {
    return "+-/".indexOf(this.char) !== -1
    // return "+-/".includes(this.char)
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
      this.char === "!"
    )
  }

  isCombinator() {
    return (
      this.char === "," ||
      this.char === ">" ||
      this.char === "+" ||
      this.char === "~"
    )
  }

  // escape //? \/\* - but dont need esc anything else?
  isComment() {
    return this.char + this.peek() === "/*"
  }

  isCommentEnd() {
    return this.char === "*" && this.peek() === "/"
    // && this.char === undefined
  }

  lookback(n) {
    return n ?
      this.input[this.curr - n] :
      this.input[this.curr - 1]
  }

  // peek that skips certain chars/tokens, eg. WS - peekNextRelevantToken/char
  // n = peek a certain char a head, not, all until n
  // peek return n char ahead or peek return all n chars ahead?
  peek(n) {
    return n ?
      this.input[this.curr + n] :
      this.input[this.curr + 1]
  }

  // moves down if char is \n
  // if move many steps, does it still manage to recoqnize its gone down a line?
  next(n, move) {
    // move && this.move(n)
    return this.char = n ?
      this.input[this.curr = this.curr + n] : // more eff to 2? since dont reiterate?
      this.input[++this.curr]
  }

  // move this fn up into next, not the content. need sep sometimes? dont think so.
  move(n) { // movePos, moveCaret, moveLoc, moveIndex, moveMarker, moveCursor
    if (this.isNewline()) n ? this.line = this.line + n : this.line++
    n ? this.pos = this.pos + n : this.pos++
    if (this.isNewline()) this.pos = 0 // if not under, it set 0 before? so we get 1? just move first line under then?
  }
  // wrap fn? add to next
  // wrap next in parser too?

  // move first, THEN go next

  // move(n) { // movePos, moveCaret, moveLoc, moveIndex, moveMarker, moveCursor
  //   n ? this.pos = this.pos + n : this.pos++
  //   if (this.isNewline()) n ? this.line = this.line + n, this.pos = 0 : this.line++, this.pos = 0
  // }

  // start gives info about later, so we can assume. html grouping tag etc

  // moveCaret, should be defualt in next, moveCaret arg false ? move() then call move() self after independatly

  // if obj we use it instead? or call this. set var we can. then add more etc. at any stage
  createToken(type, val, start) { // use assign instead? or createAfter?
    var token = {
      type: type,
      val:  val,
      line: this.line,
      // startLine: line, line as arg. {line: {start, end}, col: {start, end}}
      start: start,
      end: this.pos
    }
    this.tokens.push(token)
    return token
  }
}
