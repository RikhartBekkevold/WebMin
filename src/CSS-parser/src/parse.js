// instead of req here. then later req this file. req them both in index.
// this file return an obj with the functions as props. which index assign() to Parser for us.
const pp = require('./parser').Parser.prototype;

////////////////////////////////
pp.parse = function(config) {
  var ast = {
    type: "Stylesheet",
    rules: []
  }

  if (this.isCharsetRule()) ast.rules.push(this.parseCharset()), this.next()
  if (config.prependComment !== "") ast.rules.push(this.parseComment(config.prependComment))

  // is this uneccessary?
  if (this.isWhitespace()) this.next()

  while (this.token !== undefined) {
    var node = this.parseToplevel()
    if (node) ast.rules.push(node)
    this.next()
  }

  return ast
}


////////////////////////////////
pp.parseToplevel = function(noImp, isKeyframe) {
  if (this.isSelector(isKeyframe))  return this.parseSelectorList(noImp, isKeyframe)
  if (this.isComment())             return this.parseComment()    // we dont record any comment tokens currently.
  if (this.isDelim())               return this.parseDelim()      // Unknown|illigal
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
  return false
}


////////////////////////////////
pp.parseImport = function() {
  var node = {
    type: "ImportRule",
    loc: this.createLoc(),
    url: "",
    // next, prop, array
    media: null // array so can push?
  }
  this.next()

  var fnNameNode = this.parseIdent()
  if (this.isComment()) node.parts.push(this.parseComment()), this.next()
  node.url = this.isString() ? this.parseString() : (this.next(), this.parseFunction(fnNameNode))
  this.next()

  // MEDIA stuff
  if (!this.isStatementEnd()) {
    node.media = []
    while (!this.isStatementEnd()) {
      if (this.isParanStart()) {
        var statement = {
          type: "Statement",
          loc: this.createLoc(),
          prop: "",
          val: {}
        }
        this.next()
        statement.prop = this.token.val
        // can be sapce, but since in loop?!!
        this.next(2) // wrong too? spacing issue? comment?
        statement.val = this.parseValues()
        node.media.push(statement)
        node.loc.end.line = this.token.line
        node.loc.end.col = this.token.end
      }
      else {
        node.media.push(this.parseAtom())
        this.next()
      }
    }
  }
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
// charset only allowed at first line/col. and it is only legal with " and not '
pp.parseCharset = function() {
  var node = {
    type: "CharsetRule",
    loc: this.createLoc(),
    encoding: "",
  }
  // comment after and before encoding
  // charset CANT HAVE COMMENTS. illigal syntax.
  this.next()
  node.encoding = this.parseString() // pass var isCharset, or allowOnlyDoubleQuote? dont need to enforce erro. we allow both. so we allow t he legal syntax, even if we allow more.

  // do error here etc
  this.next()
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseFontface = function() {
  var node = {
    type: "FontFaceRule",
    loc: this.createLoc(),
    block: {}
  }
  this.next()
  node.block = this.parseBlock()
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseKeyframes = function() {
  var node = {
    type: "KeyframesRule",
    loc: this.createLoc(),
    name: "",
    arguments: []
  }
  this.next()
  node.name = this.token.val
  // FIX, allow n and skip space?
  this.next() // need to be 4 with space. expand next so we can mix n and ignore space?
  this.next() // need to be 4 with space. expand next so we can mix n and ignore space?
  while (!this.isBlockEnd()) {
    // var tempnode = this.parseToplevel(true, true)
    // if (tempnode) node.arguments.push(tempnode)
    node.arguments.push(this.parseToplevel(true, true)) // this allows nesting of all other rules. inc selector. but we just trust it will only go there
    this.next()
  }
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end

  return node
}


////////////////////////////////
pp.parseMediaList = function() {
  var node = {
    type: "MediaQueryList",
    loc: this.createLoc(),
    queries: [],
    selectors: []
  }
  this.next()
  node.queries.push(this.parseMedia())
  while (this.isListSeparator()) {
    this.next()
    node.queries.push(this.parseMedia())
  }
  this.next()
  while (!this.isBlockEnd()) {
    // HUGE whitelist. most of this shouldnt be in a media?
    var tempnode = this.parseToplevel() // inMedia = true?
    if (tempnode) node.selectors.push(tempnode)
    this.next()
  }
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseMedia = function() {
  var node = {
    type: "MediaRule",
    loc: this.createLoc(),
    def: []
  }
  while(!this.isBlockStart() && !this.isListSeparator()) {
    // if atom return undef, since not atom, we check the other - selectively call to lists, one or both!
    node.def.push(this.parseAtom() || this.parseMediaFeature()) // if parseatom returned undefined (passed all ifs) - if goes through last, pushes undefined
    this.next()
  }
  node.loc.end.line = this.token.line // temp hack to make ast work? this doesnt seem to actually create end line, just copies same for both
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseMediaFeature = function() {
  var node = {
    type: "MediaFeature",
    loc: this.createLoc(),
    prop: null,
    val: null
  }
  this.next()
  node.prop = this.parseIdent()
  // this.next(2) TypeError: Cannot read property 'type' of undefined
  this.next()
  this.next()
  node.val = this.parseAtom()
  this.next()
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseSelectorList = function(noImp, isKeyframe) {
  var node = {
    type: "StyleRule",
    loc: this.createLoc(),
    selectors: [],
    rules: {}
  }
  node.selectors.push(this.parseSelector(isKeyframe))
  while (this.isListSeparator()) {
    this.next()
    node.selectors.push(this.parseSelector(isKeyframe))
  }
  node.rules = this.parseBlock(noImp) // parseDeclarations, which wraps in block, would be much better?
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseUniversal = function(isKeyframe, context) {
  return {
    type: "UniversalSelector",
    loc: this.createLoc(),
    name: this.token.val
  }
}


////////////////////////////////
// parse a selector that has several selectors as a part of it. aka body.dark
pp.parseComplex = function(isKeyframe, context) {
  var node = {
    type: "ComplexSelector",
    loc: this.createLoc(),
    selectors: [],
    specificity: [0, 0, 0]
  }


  // remove this/move inside (asterisk esp.), creates asterisk wl, then add to pred asterisk/tag? we already added tag inside (since attri)
  if (this.isTag())
    node.selectors.push(this.parseTag()), node.specificity[2]++, this.next(null, true)
  else if (this.isAsterisk())
    node.selectors.push(this.parseUniversal()), this.next(null, true)
    if (this.isTag())
      node.selectors.push(this.parseTag()), node.specificity[2]++, this.next(null, true)

  while(!this.isWhitespace() && !this.isBlockStart() && !this.isListSeparator() && !this.isCombinator()) {
    if (this.isClass() && !isKeyframe)               node.selectors.push(this.parseClass()), node.specificity[1]++
    else if (this.isTag())  /*&& !isKeyframe? */     node.selectors.push(this.parseTag()), node.specificity[2]++
    else if (this.isID() && !isKeyframe)             node.selectors.push(this.parseID()), node.specificity[0]++
    else if (this.isPseudoElement() && !isKeyframe)  node.selectors.push(this.parsePseudoElement()), node.specificity[2]++
    else if (this.isPseudoClass() && !isKeyframe)    node.selectors.push(this.parsePseudoClass()), node.specificity[1]++
    else if (this.isAttribute() && !isKeyframe)      node.selectors.push(this.parseAttribute()), node.specificity[1]++
    else if (this.isComment())                       node.selectors.push(this.parseComment())
    // no num and isAsterisk?
    // asterisk illigal
    // percentage only in keyframes, and it cant trigger complex

    this.next(null, true)
  }

  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


// ADD HERE: parse commnet? inside parseBlock! add parse comment to util? just always runs if next? and return   var comment =  next() commentpuhs?
////////////////////////////////
pp.parseSelector = function(isKeyframe, context) {
  var node = {
    type: "SelectorPattern",
    loc: this.createLoc(),
    selectors: [],
    specificity: [
      0,    // IDs
      0,    // Classes, attributes and pseudo-classes
      0     // Elements and pseudo-elements
    ]
  }

  while(!this.isBlockStart() && !this.isListSeparator()) {
    // ||  this.isAsterisk() && this.isAsterisk()
    if ((this.isSelector(isKeyframe) && this.isComplex()) || (this.isAsterisk() && this.isTag(this.peek()))) {
      var complexSelector = this.parseComplex()
      node.selectors.push(complexSelector)
      // whether there are space or not shouldnt affect spec, per online spec calc
      for (var i = 0; i < complexSelector.specificity.length; i++)
        node.specificity[i] += complexSelector.specificity[i]
    }
    else if (this.isTag())                           node.selectors.push(this.parseTag()),           node.specificity[2]++
    else if (this.isPercentage() && isKeyframe)      node.selectors.push(this.parsePercentage()),    node.specificity[2]++
    else if (this.isAsterisk() && !isKeyframe)       node.selectors.push(this.parseUniversal())
    else if (this.isClass() && !isKeyframe)          node.selectors.push(this.parseClass()),         node.specificity[1]++
    else if (this.isID() && !isKeyframe)             node.selectors.push(this.parseID()),            node.specificity[0]++
    else if (this.isCombinator() && !isKeyframe)     node.selectors.push(this.parseCombinator())
    else if (this.isPseudoElement() && !isKeyframe)  node.selectors.push(this.parsePseudoElement()), node.specificity[2]++
    else if (this.isPseudoClass() && !isKeyframe)    node.selectors.push(this.parsePseudoClass()),   node.specificity[1]++
    else if (this.isAttribute() && !isKeyframe)      node.selectors.push(this.parseAttribute()),     node.specificity[1]++
    else if (this.isComment())                       node.selectors.push(this.parseComment());

    this.next(null, true)
  }
  // the end token could be the start of another token, witout next after, so..

  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parsePseudoElement  = function () {
  let node = {
    type: "PsuedoElementSelector",
    loc: this.createLoc(),
    name: ""
  }
  this.next()
  node.name = this.token.val
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
};


////////////////////////////////
pp.parsePseudoClass  = function () {
  let node = {
    type: "PseudoClassSelector",
    loc: this.createLoc(),
    name: ""
  }
  this.next()
  node.name = this.token.val
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
};


////////////////////////////////
pp.parseAttribute = function() {
  let node = {
    type: "AttributeSelector",
    loc: this.createLoc(),
    name: "",
    operator: null,
    value: null,
    flag: null
  }
  this.next()
  node.name = this.parseIdent()
  this.next()
  if (this.isAttributeOperator()) {  //|| this.isAsterisk() isAttrubOP => isAsterisk || isOperator? || is
    node.operator = this.token.val
    this.next()
    // assume that if operator exists, value does too.
    // assume the value can only be a string.
    node.value = this.parseString()
    this.next()
    // assumes flag has to be after value (alters caps of value), and value after operator
    if (this.isIdent()) node.flag = this.parseIdent(), this.next()
  }

  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseClass = function() {
  return {
    type: "ClassSelector",
    loc: this.createLoc(),
    name: this.token.val
  }
}


////////////////////////////////
pp.parseTag = function() {
  return {
    type: "TagSelector",
    loc: this.createLoc(),
    name: this.token.val
  }
}


////////////////////////////////
pp.parseID = function() {
  return {
    type: "IdSelector",
    loc: this.createLoc(),
    name: this.token.val,
    len: this.token.val.length + 1 // each time we add a id. do we return a number instead? to concat to selPattern?
    // do we factor in space here? how?

    // we only interested in length if a selector is in a list, and match other selectors
    // if simply a non list match, we dont care about comapring strings?
  }
}


////////////////////////////////
pp.parseCombinator = function() {
  return {
    type: "Combinator",
    loc: this.createLoc(),
    name: this.token.val
  }
}

// its in a context unexpected?
// if decision need to be made furhter down the path. pass a varible|arg all the way.
////////////////////////////////
pp.parseBlock = function(noImp) {
  var node = {
    type: "Block",
    loc: this.createLoc(),
    // comments: [], // two arrays will mess up the index - but we never need it? for disp yes! must disp in right place!
    statements: []
  }
  this.next()
  while (!this.isBlockEnd()) {
    if (this.isComment()) node.statements.push(this.parseComment())
    if (this.isStatementStart()) node.statements.push(this.parseStatement(noImp))
    this.next()
  }
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseStatement = function(noImp) {
  var node = {
    type: "Statement",
    important: false,
    property: "",
    loc: this.createLoc(),
    value: {}
  }
  node.property = this.token.val
  this.next(2) // WRONG? works even thouhg not in loop? or does it really. did i check output?
  // this.next() // WRONG?
  // this.next() // WRONG?
  node.value = this.parseValues(node, noImp)
  // val
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseValues = function(parent, noImp) {
  var node = {
    type: "Value",
    loc: this.createLoc(),
    parts: []
  }

  while (!this.isStatementEnd()) {
    if (this.isComment())    node.parts.push(this.parseComment())
    if (this.isNum())        node.parts.push(this.parseNum())
    if (this.isPercentage()) node.parts.push(this.parsePercentage())
    if (this.isDimension())  node.parts.push(this.parseDimension())
    if (this.isFunction())   node.parts.push(this.parseFunction(node.parts.pop()))
    if (this.isString())     node.parts.push(this.parseString())
    if (this.isHex())        node.parts.push(this.parseHex()) // determines its hex by context - just use same names. diff pred, but the rpeds yse same fns. soeffectlyu
    // different is and parse fns here too!
    // shouuld ahve used only # thohg. not full #val! but works too

      // can add config to pred? need to be both imp and remove! removeImpInkeyframes
    if (this.isIdent()) node.parts.push(this.parseIdent())
    // must be after, or in if else - so next gets past importnat ident
    if (this.isImportant()) { // isImp && shouldParseImp - peek to see if ident and importnat is next?
      if (this.shouldKeepImportant(noImp)) { // shouldKeepKeyframeImportant?
        parent.important = true
      }
      this.next()
    }

    this.next()
  }

  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseAtom = function() {
  if (this.isNum())        return this.parseNum()
  if (this.isPercentage()) return this.parsePercentage()
  if (this.isDimension())  return this.parseDimension()
  if (this.isIdent())      return this.parseIdent()
  if (this.isString())     return this.parseString()
  if (this.isHex())        return this.parseHex()
  if (this.isOperator())   return this.parseOperator()
}


////////////////////////////////
// EXPLAIN WHY THIS CHOICE - why ListSeparator is parsed like this
pp.parseListSeparator = function(token) {
  return {
    type: "ListSeparator",
    loc: this.createLoc(token),
    val: ","
  }
}


////////////////////////////////
// "(" trigger parseFunction. it then uses the prev ident as name,
// and removes previously parsed/pushed ident.
// change to ident + "(" combo triggering isFunction?
pp.parseFunction = function(token) {
  var node = {
    type: "Function",
    name: token.name,
    loc: this.createLoc(token),
    arguments: []
  }
  this.next()
  while (!this.isParanEnd()) {
    if (this.isListSeparator()) node.arguments.push(this.parseListSeparator()), this.next()
    if (this.isAsterisk())
      // switch this if isOperator including asterisk
      node.arguments.push(this.parseOperator()) // inc in parseAtom. must be part of isOperator - can do both?
    else
      node.arguments.push(this.parseAtom())
    this.next()
  }
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end
  return node
}


////////////////////////////////
pp.parseNum  = function() {
  return {
    type: "Number",
    loc: this.createLoc(),
    val: this.token.val,
    isInt: this.token.isInt,
    isEpsilon: this.token.isEpsilon
  }
}


////////////////////////////////
pp.parsePercentage  = function() {
  return {
    type: "Percentage",
    loc: this.createLoc(),
    val: this.token.val,
    isInt: this.token.isInt,
    isEpsilon: this.token.isEpsilon
  }
}


////////////////////////////////
pp.parseDimension  = function() {
  return {
    type: "Dimension",
    loc: this.createLoc(),
    val: this.token.val,
    unit: this.token.unit,
    isInt: this.token.isInt,
    isEpsilon: this.token.isEpsilon
  }
}


////////////////////////////////
pp.parseHex = function() {
  return {
    type: "Hex",
    loc: this.createLoc(),
    val: this.token.val
  }
}


////////////////////////////////
pp.parseIdent = function() {
  return {
    type: "Identifier",
    loc: this.createLoc(),
    name: this.token.val
  }
}


////////////////////////////////
pp.parseString = function() {
  return {
    type: "String",
    loc: this.createLoc(),
    val: this.token.val,
    delimiter: this.token.delimiter
  }
}


////////////////////////////////
pp.parseOperator = function(val) {
  return {
    type: "Operator",
    loc: this.createLoc(),
    val: val || this.token.val
  }
}


////////////////////////////////
pp.parseDelim = function() {
  return {
    type: "Delimiter",
    val: this.token.val
  }
}


////////////////////////////////
pp.parseComment = function (text) {
  return {
    type: "Comment",
    loc: this.createLoc(),
    val: text ? text : this.token.val
  }
}


////////////////////////////////
pp.parseNamespaceRule = function () {
  var node = {
    type: "NamespaceRule",
    loc: this.createLoc(),
    prefix: null,             // easy to add comments here? to ten expr here? clearer?
    url: null
  }
  this.next()

  if (this.isIdent() && this.token.val.toLowerCase() !== "url") {
    node.prefix = this.parseIdent()
    this.next()
  }

  if (this.isString()) {
    node.url = this.parseString()
  }
  else {
    // we assume we at ident and that its "url|URL" and fn
    let tempNode = this.parseIdent()
    this.next()
    node.url = this.parseFunction(tempNode)
  }

  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end

  return node
}




////////////////////////////////
pp.parsePageRule = function () {
  var node = {
    type: "PageRule",
    styleRule: {}
  }
  this.next()
  node.styleRule = this.parseSelectorList() // a whitelist. seems spec only allows PseudoClassSelector and indent
  return node
}


////////////////////////////////
pp.parseSupportsRule = function() {
  var node = this.parseMediaList()
  node.type = "SupportsRule"
  return node
}


////////////////////////////////
// fix loc data
// can not add loc data flag,
// do css consume (arr pop on next?), recover so ok css parser. scss parser dont?
pp.parseFontFeatureValues = function() {
  var node = {
    type: "FontFeatureValuesRule",
    loc: this.createLoc(),
    familyNames: [],
    features: {
      type: "Block",
      loc: this.createLoc(), // create after first loop
      statements: []
    }
  }

  this.next()

  while (!this.isBlockStart()) {
    if (this.isString()) node.familyNames.push(this.parseString())
    if (this.isIdent()) node.familyNames.push(this.parseIdent())
    if (this.isListSeparator()) node.familyNames.push(this.parseListSeparator()) // just add it for printing, we dont need to group?
    this.next()
  }

  this.next()

  while (!this.isBlockEnd()) {
    let tempNode = { type: "Feature", name: this.token.val, declarations: {} }
    this.next()
    tempNode.declarations = this.parseBlock() // change to loop that: idnet: parseNumber; - now whitelist - its just as easy almost
    node.features.statements.push(tempNode)
    this.next()
    // add loc data for tempNode!
  }
  // should be +1 between these
  node.loc.end.line = this.token.line
  node.loc.end.col = this.token.end

  // block ends where last statement ends
  node.features.loc.end.line = this.token.line
  node.features.loc.end.col = this.token.end

  return node
}


////////////////////////////////
pp.parsePropertyRule = function () {
  return {
    type: "PropertyRule",
    name: (this.next(), this.parseIdent()),
    rules: (this.next(), this.parseBlock())
  }
}


////////////////////////////////
pp.parseColorProfileRule = function () {
  return {
    type: "ColorProfileRule",
    name: (this.next(), this.parseIdent()), // only one - this allows -- (one is variable? two custom ident? custom property?)
    rules: (this.next(), this.parseBlock()) // huge whitelist
  }
}


////////////////////////////////
pp.parseCounterStyleRule = function () {
  return {
    type: "CounterStyleRule",
    name: (this.next(), this.parseIdent()),
    statements: (this.next(), this.parseBlock())  // huge whitelist
  }
}


////////////////////////////////
// huge whitelist
pp.parseViewportRule = function () {
  return {
    type: "ViewportRule",
    statements: (this.next(), this.parseBlock())
  }
}


////////////////////////////////
// DEPRECATED - parse if run in browsers that understnads it. recommned to remove. config flag?
pp.parseDocumentRule = function () {
  var node = {
    type: "DocumentRule",
    functions: [],
    selectors: {
      type: "Block",
      loc: this.createLoc(), // create after first loop
      statements: []         // statements imply declarations, but we here use them for stylerules as the statements
    }
  }

  this.next() // to either { or first ident/fn name

  while (!this.isBlockStart()) {
    if (this.isIdent()) {
      var temp = this.parseIdent()
      this.next()
      if (this.isFunction()) node.functions.push(this.parseFunction(temp))

      // after parsing a function, we move past ")" and continue.
      // we continue because if we dont, next "if" only checks for list, then goes next.
      // if next was another ident/fn however, it will skip past it because of the this.next after the if.
      this.next()
      continue
    }

    if (this.isListSeparator()) node.functions.push(this.parseListSeparator())
    this.next()
  }

  this.next()   // parseSelectorList expects first token to be first selector not { so we must call next

  while (!this.isBlockEnd()) {
    node.selectors.statements.push(this.parseSelectorList())
    this.next()
  }

  return node
}
