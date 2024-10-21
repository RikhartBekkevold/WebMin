const pp = require('./parser').Parser.prototype;

////////////////////////////////
pp.parse = function() {
  var ast = {
    type: "Stylesheet",
    rules: []
  }

  // isCharsetRule includes config.removeCharset
  if (this.isCharsetRule()) ast.rules.push(this.parseCharset()), this.next()
  if (this.config.prependComment !== "") ast.rules.push(this.parseComment(this.config.prependComment))

  // if config then add instead, go next after
  // if (this.isWhitespace()) this.next()

  while (this.token !== undefined) { // for token of this.tokens - this.tokens.forEach
    var node = this.parseToplevel()
    if (node) ast.rules.push(node)
    this.next()
  }

  return ast
}


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
}



////////////////////////////////
// STYLERULE
////////////////////////////////


////////////////////////////////
pp.parseSelectorList = function(noImp, isKeyframe) {
  var node = {
    type: "StyleRule",
    selectors: [],
    rules: {}
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  node.selectors.push(this.parseSelectorPattern(isKeyframe))
  while (this.isListSeparator()) {
    this.next()
    node.selectors.push(this.parseSelectorPattern(isKeyframe))
  }
  node.rules = this.parseBlock(noImp)

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseSelectorPattern = function(isKeyframe, context) {
  var node = {
    type: "SelectorPattern",
    selectors: [],
  }

  if (this.config.addSpecificity)
    node.specificity = [
      0,    // IDs
      0,    // Classes, attributes and pseudo-classes
      0     // Elements (tag) and pseudo-elements
    ]

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  while(!this.isBlockStart() && !this.isListSeparator() && (!this.isParanEnd())) { // || context === "scope"
    node.selectors.push(this.parseSelector(isKeyframe, node.specificity))
    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


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
}


////////////////////////////////
// parse a (compound) selector that has several selectors as a part of it. e,g, body.dark
pp.parseComplex = function(isKeyframe, specificity) {
  var node = {
    type: "ComplexSelector",
    selectors: []
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  if (this.isTag())
    node.selectors.push(this.parseTag()), specificity && specificity[2]++, this.next(null, true)
  else if (this.isAsterisk())
    node.selectors.push(this.parseUniversal()), this.next(null, true)
    if (this.isTag())
      node.selectors.push(this.parseTag()), specificity && specificity[2]++, this.next(null, true)

  while(!this.isWhitespace() && !this.isBlockStart() && !this.isListSeparator() && !this.isCombinator()) {
    if (this.isClass() && !isKeyframe)               node.selectors.push(this.parseClass()), specificity && specificity[1]++
    else if (this.isTag())  /*&& !isKeyframe? */     node.selectors.push(this.parseTag()), specificity && specificity[2]++
    else if (this.isID() && !isKeyframe)             node.selectors.push(this.parseID()), specificity && specificity[0]++
    else if (this.isPseudoElement() && !isKeyframe)  node.selectors.push(this.parsePseudoElement()), specificity && specificity[2]++
    else if (this.isPseudoClass() && !isKeyframe)    node.selectors.push(this.parsePseudoClass()), specificity && specificity[1]++
    else if (this.isAttribute() && !isKeyframe)      node.selectors.push(this.parseAttribute()), specificity && specificity[1]++
    else if (this.isComment())                       node.selectors.push(this.parseComment())
    else this.parseUnknown()
    this.next(null, true)
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseBlock = function(noImp) {
  var node = {
    type: "Block",
    declarations: []
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  while (!this.isBlockEnd()) {
    if (this.isComment()) node.declarations.push(this.parseComment())
    else if (this.isDeclarationStart()) node.declarations.push(this.parseDeclaration(noImp))
    else if (this.isStartingStyleRule()) node.declarations.push(this.parseStartingStyleRule(true))

    // can parse infinitely nested stylerules, but only & can trigger
    // allow & only to parse nested stylerules
    else if (this.isNestingSelector())  node.declarations.push(this.parseSelectorList())

    else this.parseUnknown()
    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseDeclaration = function(noImp) {
  var node = {
    type: "Declaration",
    important: false,
    property: "",
    value: {}
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  // if correct val, add, else add unknown?
  node.property = this.token.val
  this.next(2)

  node.value = this.parseValues(node, noImp)

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}



////////////////////////////////
pp.parseValues = function(parent, noImp) {
  var node = {
    type: "Value",
    parts: []
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  while (!this.isDeclarationEnd()) { // isEnd here too? or have push trash at end. then end up in tree. unknown.
    if (this.isComment())            node.parts.push(this.parseComment())
    // "DeclarationValueSeparator" aka isListSeparator
    else if (this.isListSeparator()) node.parts.push(this.parseListSeparator())
    else if (this.isOperator())      node.parts.push(this.parseOperator())
    else if (this.isNum())           node.parts.push(this.parseNum())
    else if (this.isPercentage())    node.parts.push(this.parsePercentage())
    else if (this.isDimension())     node.parts.push(this.parseDimension())
    else if (this.isUrl())           node.parts.push(this.parseQuotelessString())
    else if (this.isFunction())      node.parts.push(this.parseFunction(node.parts.pop()))
    else if (this.isString())        node.parts.push(this.parseString())
    else if (this.isHex())           node.parts.push(this.parseHex())
    else if (this.isIdent())         node.parts.push(this.parseIdent())
    else                             node.parts.push(this.parseUnknown())

    if (this.isImportant())        { parent.important = true; this.next() }

    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
// SELECTORS
////////////////////////////////


////////////////////////////////
pp.parsePseudoElement = function() {
  let node = {
    type: "PsuedoElementSelector",
    name: ""
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.name = this.token.val
  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }
  return node
};


////////////////////////////////
pp.parsePseudoClass = function() {
  let node = {
    type: "PseudoClassSelector",
    name: ""
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.name = this.token.val
  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
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
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.name = this.maybeParseIdent()
  this.next()
  if (this.isAttributeOperator()) {
    node.operator = this.token.val
    this.next()
    node.value = this.maybeParseString()
    this.next()
    if (this.isIdent()) node.flag = this.parseIdent(), this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseClass = function() {
  var node = {
    type: "ClassSelector",
    name: this.token.val
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  return node
}


////////////////////////////////
pp.parseTag = function() {
  var node = {
    type: "TagSelector",
    name: this.token.val
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  return node
}


////////////////////////////////
pp.parseID = function() {
  var node = {
    type: "IdSelector",
    name: this.token.val,
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseUniversal = function(isKeyframe, context) {
  var node = {
    type: "UniversalSelector",
    name: this.token.val
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseCombinator = function() {
  var node = {
    type: "Combinator",
    name: this.token.val
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseListSeparator = function(token) {
  var node = {
    type: "ListSeparator",
    val: ","
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
// "(" trigger parseFunction. it then uses the prev ident as name,
// and removes previously parsed/pushed ident.
// change to ident + "(" combo triggering isFunction?
pp.parseFunction = function(token) {
  var node = {
    type: "Function",
    name: token.name,
    arguments: []
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  while (!this.isParanEnd()) {
    if (this.isListSeparator()) node.arguments.push(this.parseListSeparator())
    else if (this.isAsterisk() || this.isDelim())
      node.arguments.push(this.parseOperator())
    else if (this.isFunction())
      node.arguments.push(this.parseFunction(node.arguments.pop()))
    else // isAtom
      node.arguments.push(this.parseAtom())
    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


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
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parsePercentage  = function() {
  var node = {
    type: "Percentage",
    val: this.token.val,
    isInt: this.token.isInt,
    isEpsilon: this.token.isEpsilon
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseDimension  = function() {
  var node = {
    type: "Dimension",
    val: this.token.val,
    unit: this.token.unit,
    isInt: this.token.isInt,
    isEpsilon: this.token.isEpsilon
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseHex = function() {
  var node = {
    type: "Hex",
    val: this.token.val
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseIdent = function() {
  var node = {
    type: "Identifier",
    name: this.token.val
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.maybeParseIdent = function() {
  return this.isIdent()
  ? this.parseIdent()
  : this.parseUnknown()
}


////////////////////////////////
pp.parseString = function() {
  var node = {
    type: "String",
    val: this.token.val,
    delimiter: this.token.delimiter
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.maybeParseString = function() {
  return this.isString()
  ? this.parseString()
  : this.parseUnknown()
}


////////////////////////////////
// strictly: url(path without quotes)
pp.parseQuotelessString = function(isKeyframe, context) {
  var node = {
    type: "QuotelessUrl",
    val: this.token.val,
    name: this.token.name
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}

////////////////////////////////
pp.parseOperator = function(val) {
  var node = {
    type: "Operator",
    val: val || this.token.val
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseUnknown = function() {
  var node = {
    type: "Unknown",
    token: this.token
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseNamespacePrefixSeparator = function() {
  var node = {
    type: "NamespacePrefixSeparator",
    val: this.token.val // can be both "|" or "|*", save for codegen
    // name: "" // svg
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

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
  return this.parseUnknown()
}


////////////////////////////////
pp.parseComment = function (text) {
  var node = {
    type: "Comment",
    val: text ? text : this.token.val
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


////////////////////////////////
pp.parseWhitespace = function() {
  var node = {
    type: "Whitespace",
    val: this.token.val   // \n \s etc, can be "\n\r\n\r\s"
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}


/////////////////////////////////
// AT RULES
/////////////////////////////////


////////////////////////////////
pp.parseNamespaceRule = function () {
  var node = {
    type: "NamespaceRule",
    prefix: null,
    url: null
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()

  if (this.isIdent() && this.token.val.toLowerCase() !== "url") {
    node.prefix = this.parseIdent()
    this.next()
  }

  if (this.isString()) {
    node.url = this.parseString()
  }
  else if (this.isUrl()) {
    node.url = this.parseQuotelessString() // parseQuotlessStringUrlFunction or parseUrl
  }
  else {
    // we assume we at ident and that its "url|URL" and fn
    let tempNode = this.parseIdent() //{//} this.maybeParseIdent()
    this.next()
    node.url = this.parseFunction(tempNode)
  }
  console.log(this.token);
  this.next()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parsePageRule = function () {
  var node = {
    type: "PageRule",
    styleRule: {}
  }
  this.next()
  node.styleRule = this.parseSelectorList() // a whitelist, spec only allows PseudoClassSelector and indent
  return node
}



////////////////////////////////
pp.parseSupportsRule = function() {
  var node = this.parseMediaList()
  node.type = "SupportsRule"
  return node
}


////////////////////////////////
pp.parseFontPaletteValuesRule = function() {
  var node = {
    type: "FontPaletteValuesRule",
    name: (this.next(), this.maybeParseIdent()),
    rules: {}
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.rules = this.parseBlock()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseFontface = function() {
  var node = {
    type: "FontFaceRule",
    rules: {} // declarations?
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.rules = this.parseBlock()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}

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
  }

  // if in createLoc, same thing. same class reads the config. but only one fn. instead of many
  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  while (!this.isBlockStart() && !this.isDeclarationEnd()) { // while this.isIdent() - wont end if neither encountered
    if (this.isIdent()) node.names.push(this.parseIdent()) // while not a chars vs while is
    // veryfi that always every second? peek?
    else if (this.isListSeparator()) node.names.push(this.parseListSeparator())
    this.next()
  }

  // if ; fast path? also must go next if ;? outside should - caller

  if (this.isBlockStart()) {
    // preserves @layer state {} - replace with block node - or remove empty layer rule
    node.hasEmptyBlock = true

    this.next()
    while (!this.isBlockEnd()) {
      node.rules.push(this.parseSelectorList()) // ends on }
      this.next()
    }
  }

  // two atrule keywords cant be on the same line????
  // seems anything after layer module; will seem invalid by the shl.
  // use parseSelectorList for keyframe too? works with inKeyframe arg?
      // entire stylerule/rule, and call fn to loop untill a char, consumeWitoutAddingNode("char"|pred)
  // else if ;

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


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
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()

  while (!this.isBlockStart()) {
    if (this.isString()) node.familyNames.push(this.parseString())
    else if (this.isIdent()) node.familyNames.push(this.parseIdent())
    else if (this.isListSeparator()) node.familyNames.push(this.parseListSeparator()) // just add it for printing, we dont need to group?
    else this.parseUnknown()
    this.next()
  }

  // move below first loop?
  if (this.config.addLocationData)
    node.features.loc = this.createLoc()

  this.next()

  while (!this.isBlockEnd()) {
    let tempNode = { type: "Feature", name: this.token.val, declarations: {} }
    this.next()
    tempNode.declarations = this.parseBlock() // change to loop that: idnet: parseNumber; - now whitelist - its just as easy almost
    node.features.declarations.push(tempNode)
    this.next()
    // add loc data for tempNode!
  }
  // should be +1 between these
  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  // block ends where last declaration ends
  if (this.config.addLocationData) {
    node.features.loc.end = this.finishLoc()
  }
  return node
}


////////////////////////////////
pp.parsePropertyRule = function () {
  var node = {
    type: "PropertyRule",
    name: "",
    rules: {}
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.name = this.maybeParseIdent()
  this.next()
  node.rules = this.parseBlock()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseColorProfileRule = function () {
  var node = {
    type: "ColorProfileRule",
    name: "",
    rules: {} // huge whitelist
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.name = this.maybeParseIdent()
  this.next()
  node.rules = this.parseBlock()

  if (this.config.addLocationData)
    node.loc.end = this.finishLoc()

  return node
}


////////////////////////////////
pp.parseCounterStyleRule = function () {
  var node = {
    type: "CounterStyleRule",
    name: "",
    declarations: {}  // huge whitelist
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.name = this.maybeParseIdent()

  this.next()
  node.declarations = this.parseBlock()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
// huge whitelist
pp.parseViewportRule = function () {
  var node = {
    type: "ViewportRule",
    declarations: {} // call rules?
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.declarations = this.parseBlock()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


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
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

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
    if (this.isUrl()) node.functions.push(this.parseQuotelessString())
    if (this.isListSeparator()) node.functions.push(this.parseListSeparator())

    this.next()
  }

  this.next()   // parseSelectorList expects first token to be first selector not { so we must call next

  while (!this.isBlockEnd()) {
    // parseSelectorList return StyleRule obj with declaraiton prop, so shouldnt push?
    // parseToplevel seems to work for parseKeyframes
    // wont add {} since we dont parseBlock - selectorlist wont add before
    // should add for rule manually in printer, since its wrapping around the document
    // problem for ast users? create tempNode block here? so printer can
    node.selectors.declarations.push(this.parseSelectorList())
    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseScopeRule = function() {
  var node = {
    type: "ScopeRule",
    // list, scopelist, media features, patterns, selectorPattenrs
    scopes: [], // prelude section // isnt only selectors. printer stop assuming parent of class has selectors arr
    rules: []
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()

  // include ( as selector end? else parseSelector never ends - orParseMediaFeature? make parseSelector its own fn, sep from while loop, so can call elsewhere too
  this.next()
  if (this.isParanStart()) {
    this.next()
    // scopes, prelude - root limit
    //|sellist|selectors - fromScope, toScope
    node.scopes.push(this.parseScopePrelude())
    this.next()
  }

  if (this.isIdent()) {
    node.scopes.push(this.parseIdent()) // in this context make it a special type? so can have print visitor instead of print context preds
    this.next()
  }

  if (this.isParanStart()) {
    this.next()
    node.scopes.push(this.parseScopePrelude())
    this.next()
  }

  if (this.isBlockStart()) {
    this.next()
    while (!this.isBlockEnd()) {
      node.rules.push(this.parseSelectorList()) // ends on }
      this.next()
    }
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseScopePrelude = function() {
  var node = {
    type: "Scope",
    selectors: []
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  node.selectors.push(this.parseSelectorPattern())
  while (this.isListSeparator()) {
    this.next()
    node.selectors.push(this.parseSelectorPattern()) // parses untill , or { or )
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseStartingStyleRule = function(nested) {
  var node = {
    type: "StartingStyleRule",
    rules: []
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()

  if (this.isBlockStart()) {
    if (nested) {
      // rules: [ { type: 'Block', declarations: [Array] } ]
      node.rules.push(this.parseBlock())
    }
    else {
      this.next()
      while (!this.isBlockEnd()) {
        node.rules.push(this.parseSelectorList()) // ends on }
        this.next()
      }
    }
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}



////////////////////////////////
pp.parseImport = function() {
  var node = {
    type: "ImportRule",
    url: "",
    media: null // not always being [] causes problems in printer?
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()

  var fnNameNode = this.maybeParseIdent() // all tokens have val, so its ok
  // can comment be after url too? and inside url/fn?
  if (this.isComment()) node.parts.push(this.parseComment()), this.next() // node.comments. can printer print?
  node.url = this.isString() ?
                this.parseString() :
                this.isUrl() ?
                  this.parseQuotelessString() :
                  (this.next(), this.parseFunction(fnNameNode))
  this.next()

  // MEDIA stuff
  // related to punc? doesnt know )
  // if invalid css, errs. if not ; after ) - pushes null node, so traverser cant read type
  // looks like generic parsing of more specific import syntax
  if (!this.isDeclarationEnd()) {
    node.media = []
    while (!this.isDeclarationEnd()) {
      if (this.isParanStart()) {
        var declaration = {
          type: "Declaration",
          loc: this.createLoc(),
          prop: "",
          val: {}
        }
        this.next()
        declaration.prop = this.token.val
        // can be sapce, but since in loop?!!
        this.next(2) // wrong too? spacing issue? comment?
        declaration.val = this.parseValues()
        node.media.push(declaration)
        node.loc.end.line = this.token.line
        node.loc.end.col = this.token.end
      }
      else {
        // pushes undefined if nothing.
        node.media.push(this.parseAtom()) // else parseTrash? then node that can be read and reproduced
        // else need to detect all valid types here, and have else throw?. instead of looking for end.
        // what if end never comes?
        this.next()
      }
    }
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }
  return node
}


////////////////////////////////
// charset only allowed at first line/col. and it is only legal with " and not '
pp.parseCharset = function() {
  var node = {
    type: "CharsetRule",
    encoding: "",
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.encoding = this.maybeParseString()
  this.next()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}



////////////////////////////////
pp.parseKeyframes = function() {
  var node = {
    type: "KeyframesRule",
    name: "",
    arguments: []
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.name = this.maybeParseIdent()
  this.next()
  this.next()
  while (!this.isBlockEnd()) {
    // parseSelectorList IS THE CORRECT THING TO DO!
    node.arguments.push(this.parseToplevel(true, true))
    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}

////////////////////////////////
// MEDIA
////////////////////////////////

////////////////////////////////
pp.parseMediaList = function() {
  var node = {
    type: "MediaQueryList",
    queries: [],
    selectors: []
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.queries.push(this.parseMedia())
  while (this.isListSeparator()) {
    this.next()
    node.queries.push(this.parseMedia())
  }
  this.next()
  while (!this.isBlockEnd()) {
    var tempnode = this.parseToplevel()
    if (tempnode) node.selectors.push(tempnode)
    this.next()
  }
  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }
  return node
}


////////////////////////////////
pp.parseMedia = function() {
  var node = {
    type: "MediaRule",
    def: []
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()

  while(!this.isBlockStart() && !this.isListSeparator()) {
    node.def.push(this.parseAtom() || this.parseMediaFeature())
    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }
  return node
}


////////////////////////////////
pp.parseMediaFeature = function() {
  var node = {
    type: "MediaFeature",
    prop: null,
    val: null
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.prop = this.maybeParseIdent()
  // this.next(2) TypeError: Cannot read property 'type' of undefined
  this.next()
  this.next()
  node.val = this.parseAtom()
  this.next()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}



////////////////////////////////
pp.parseContainerRule = function() {
  var node = {
    type: "ContainerRule",
    conditions: [],
    rules: null
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()

  while (this.isCondition() || this.isIdent()) {
    // ident can be container-name or to|and|or
    if (this.isIdent()) node.conditions.push(this.parseIdent())
    else node.conditions.push(this.parseContainerCondition())
    this.next()
  }

  this.next()
  node.rules = {type: "Block", declarations: []}

  while (!this.isBlockEnd()) {
    node.rules.declarations.push(this.parseToplevel())
    this.next()
  }

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseContainerCondition = function() {
  var node = {
    type: "ContainerCondition",
    prop: null,
    operator: null,
    val: null
  }

  if (this.config.addLocationData)
    node.loc = this.createLoc()

  this.next()
  node.prop = this.maybeParseIdent()
  this.next()
  node.operator = this.isCombinator() ? this.parseCombinator() : this.parseOperator()

  this.next()
  node.val = this.parseAtom()
  this.next()

  if (this.config.addLocationData) {
    node.loc.end = this.finishLoc()
  }

  return node
}


////////////////////////////////
pp.parseNestingSelector = function() {
  var node = {
    type: "NestingSelector"
  }
  if (this.config.addLocationData)
    node.loc = this.createLoc()
  return node
}
