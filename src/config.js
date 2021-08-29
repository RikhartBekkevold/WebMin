module.exports = {
  removeEmptyAtRules: true,
  prependComment: "",                   // COMMENT MUST BE ADDED AFTER CHARSET? currently it doenst - if added at start, it invalidated charset, but ignored unless old browser!
  removeSpace: true,
  removeComments: true,
  keepFirstComment: false,
  skipTrailingZero: true,
  roundColorValuesHex: false,
  mergeDupliSelectors: true,
  mergeDuplicateDeclarations: true,
  removeEmptySelectors: true,           // removes selectors that contain no declarations (or comments)
  useShorthandValue: true,
  mergeVariations: true,
  removeExcessUnits: true,
  useSmallerDeclarations: true,         // useShorthandProperty: true,
  shortenUnsafeHex: false,              // shorten hex values by loss of accuracy
  replaceRgbWithHex: true,              // rgb(a)(20,30,3) to #000fff
  useShortestColorValue: true,          // converts a color to the shortest of hex or colorname
  replaceColorNameWithHex: true,
  keepImportantInKeyframes: false,      // by default we remove any "!important" appearing in keyframes, since they are ignored by the browser
  removeRedundantImportant: true,
  removeExcessImportant: false,
  removeCharset: false,
  removeDeprecatedAtRules: false,       // charset? viewport (need to declared in html)?, document? - keep to still support older browsers?
  mangleNames: false,
  mangleKeyframeNames: true,
  createSourceMap: false,
  mangleWithSpecialChars: false,
  resolveFunctionCalcValue: false,
  mergeMediaQueries: false,
  pathToIdOrClass: false
}
