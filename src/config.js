module.exports.internalParserConfig = {
  removeComments: true,
  removeSpace: false,
  addSpecificity: false,
  addLocationData: false
}

// all options exposed to user of minifier
module.exports.defaultConfig = {
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
  // charset rule ignored in modern css implementations. we remove misplaced always since invalid.

  // attempts to shorten a shorthand property (e.g. border, margin) by either re-arranging the values to require less divisional space (border:#fff solid; -> border:solid#fff;), or by removing unecessary values (margin: 20px 20px;  ->  margin: 20px;)
  optimizeShorthandProperties: true,
  removeOverridenDeclarations: true,
  // replace longhand declarations (margin-left) with shorthand wherever possible (margin)
  // only allow if we know JS does not reference any of the longhand props - only applicable when using CSSOM to ref margin?
  // style rule dont count..
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
}
