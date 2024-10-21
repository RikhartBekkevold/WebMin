const { traverseParent } = require('../parser/src/traverse.js')
const { createNameGenerator, makeMangledNameMap } = require("./mangle.js")

const Inferrer = require("./infer.js")

const {
  createDimensionNode,
  createHexNode,
  createStatementNode,
  createNumberNode,
  createIdentifierNode,
  createStringNode,
  createQuotelessUrlNode
} = require('../nodes.js')

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
} = require('./util.js')

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
} = require('./treeUtil.js')

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
} = require('./preds.js')


module.exports = function optimize(ast, config) {
  console.log("Optimizing code")

  var inferrer = new Inferrer(ast, config)
  var { varManager, mangledCustomProps, mangledNamespaceMap, mangledKeyframesMap } = inferrer.infer()
  var inKeyframe = false
  var selectorMangler =
    isEmpty(config.preMangledNames.selectors)
      ? makeMangledNameMap()
      : makeMangledNameMap(config.preMangledNames.selectors)

  traverseParent(ast, {
    ////////////////////////////////////////////////
    KeyframesRule: {
      enter(kfNode, parent, index, selPattern, arr, key) {
        inKeyframe = true
      },
      exit(kfNode, parent, index, selPattern, arr, key) {
        inKeyframe = false

        if (config.removeEmptyAtRules && kfNode.arguments.length === 0) {
          removeNodeAt(arr, index)
          return true
        }
      }
    },

    ////////////////////////////////////////////////
    MediaQueryList: {
      exit(node, parent, index, selPattern, arr, key) {
        if (config.removeEmptyAtRules && node.selectors.length === 0) {
          removeNodeAt(arr, index)
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
            : selectorMangler.mangleName(node, config.preMangledNames.selectors)
      }
    },

    ////////////////////////////////////////////////
    IdSelector: {
      enter(node, parent) {
        if (config.mangleSelectorNames)
          isEmpty(config.preMangledNames.selectors)
            ? selectorMangler.mangleName(node)
            : selectorMangler.mangleName(node, config.preMangledNames.selectors)
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
            })
          }
        }
      },

      ////////////////////////////////////////////////
      StyleRule: {
        enter(node, parent, index, selPattern, arr, key) {
          var declarations = node.rules.declarations

          if (declarations.length === 0 && config.removeEmptyStyleRules) {
            removeNodeAt(arr, index)
            return true
          }

          // if, e.g., two width declarations in the same stylerule, only need to keep the last
          if (config.removeOverridenDeclarations) {
            return removeOverridenDeclarations(node, declarations)
            removeOverridenLonghands(node, declarations)
          }

          // all longshands before its shorthand will be overwritten by the shorthand and is therefore redundant
          if (config.longhandToShorthand) {
             shortenLongHands(node)
          }
        },
        exit(node, parent, index, selPattern, arr, key) {
          if (config.removeEmptyStyleRules && node.rules.declarations.length === 0) {
            removeNodeAt(arr, index)
            return true
          }
        }
      },

      ////////////////////////////////////////////////
      Declaration: {
        enter(node, parent, index, prevSelPatterns, arr, parentArr, ancestors) {

          if (inKeyframe && node.important === true && !config.keepImportantInKeyframes) {
            // config.keepKeyframeImportantDeclarations - removeInvalidKeyframeDeclarations
            removeNodeAt(parent.declarations, index)
            return true
          }

          if (config.optimizeShorthandProperties) {
            // if prop is e.g. margin. check if we can use fewer values then currently to achieve the same semantics.
            // e.g. margin: 20px 20px; -> margin: 20px;
            if (isOrderDependantShorthandProp(node.property)) {
              optimizeValueAmount(node.value.parts)
            }

            // if property (border, font, background) that cares about the _type_ of the values, and not _order_ of the values
            // (e.g. border: 1px solid red; and border: red 1px solid; are both valid), re-arranges the values to require the fewest delimiters,
            // e.g. border: #000 1px solid; -> border:1px#000 solid;
            if (isDatatypeDependantShorthandProp(node.property)) {
              optimizeValueOrder(node.value.parts)
            }
          }

          // if you mangle keyframe names, you need to update the animation props value since it can ref the keyframe name
          if (isAnimationNamePermissibleProperty(node) && config.mangleKeyframeNames) {
            node.value.parts.forEach((part) => {
              if (part.type === "Identifier")
                if (config.preMangledNames.keyframes[part.name])
                  part.name = config.preMangledNames.keyframes[part.name]
                else if (mangledKeyframesMap[part.name])
                  part.name = mangledKeyframesMap[part.name]
            })
          }

          if (isCustomProperty(node) && config.mangleVariables && !config.resolveVariables)
            if (mangledCustomProps[node.property])
              node.property = mangledCustomProps[node.property]
            else if (config.preMangledNames.variables[node.property])
              node.property = config.preMangledNames.variables[node.property]
        },
        exit(node, parent, index) {
          if (node.value.parts.length === 0) {
            removeNodeAt(parent.declarations, index)
            return true
          }
        }
      },

      ////////////////////////////////////////////////
      QuotelessUrl: {
        enter(node, parent) {
          // ql can have whitespaces before and after it. always trim for opti.
          // if url(ql) -> str opti is done below, we also need the string to not have any whitespaces.
          node.val = node.val.trim()

          if (isInterchangableStringAndUrlContext(parent))
            // url(ql) -> str
            parent.url = createStringNode(node.val, "'")
        }
      },

      ////////////////////////////////////////////////
      NamespaceRule: {
        enter(node) {
          if (config.mangleNamespaceNames) {
            if (isEmpty(config.preMangledNames.namespaces)) {
              if (node.prefix && mangledNamespaceMap[node.prefix.name])
                node.prefix.name = mangledNamespaceMap[node.prefix.name]
            }
            else {
              if (node.prefix && config.preMangledNames.namespaces[node.prefix.name])
                node.prefix.name = config.preMangledNames.namespaces[node.prefix.name]
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
              siblings[index-1].name = config.preMangledNames.namespaces[siblings[index-1].name]
            else if (mangledNamespaceMap[siblings[index-1].name])
              siblings[index-1].name = mangledNamespaceMap[siblings[index-1].name]
        }
      },

      ////////////////////////////////////////////////
      Function: {
        enter(node, parent, currNodeIndex, visitedSelectorPatterns, arr, parentArr, ancestors) {
          if (isVariableRef(node)) {
            if (config.mangleVariables && !config.resolveVariables) {
              if (mangledCustomProps[node.arguments[0].name]) {
                node.arguments[0].name = mangledCustomProps[node.arguments[0].name]
                // also remove fallback values. if mangle name, we know var exists, so fallback will never be needed
                node.arguments = [node.arguments[0]]
              }
              else if (config.preMangledNames.variables[node.arguments[0].name]) {
                node.arguments[0].name = config.preMangledNames.variables[node.arguments[0].name],
                node.arguments = [node.arguments[0]]
              }
            }
            else if (config.resolveVariables) {
              if (varManager.hasDeclaration(node))
                return varManager.resolveSafeRef(node, parent, currNodeIndex)

              if (node.arguments.length <= 2) {
                removeNodeAt(parent.parts, currNodeIndex)
                return true
              }
              else if (node.arguments.length > 2) {
                var args = node.arguments.slice(2)
                replaceNodeAt(parent.parts, currNodeIndex, args)
                return true
              }
            }
          }

          if (isUrl(node)) {
            if (isInterchangableStringAndUrlContext(parent))
              // url(str) -> string
              parent.url = createStringNode(node.arguments[0].val, node.arguments[0].delimiter)
            // fine grain over time, so it can also go from url(str) to str sometimes in decl context aswell
            else if (isPlainDeclarationValue(parent, getGrandparent(ancestors)))
              // this can make an incorrect string, correct
              // url(str) -> url(ql)
              replaceNodeAt(parent.parts, currNodeIndex, createQuotelessUrlNode(node.arguments[0].val, node.name))

            return
          }

          if (isRGB(node) && config.useShortestColorValue) {
            // hex (#ffaadd10)(9) always shorter than rgb(0,0,0,1)(12), so always convert if rgb
            var values = getRGBValues(node.arguments)
            var hex = attemptShortenHex(RGBToHex(...values))
            replaceNodeAt(parent.parts, currNodeIndex, createHexNode(hex))
          }

          if (isBinaryCalcFunction(node) && config.resolveExpressions) {
            var evalSafeNodes = nodesAreTypes(node.arguments, "Dimension", "Operator")

            if (evalSafeNodes) {
              const parts = getExprParts(node.arguments)
              const rpn = convertExprToRPN(parts)
              const val = evaluateVariableLengthExpression(rpn)

              // make single value
              parent.parts = []
              parent.parts.push(createDimensionNode(val, "px"))
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
            var newColor = attemptMakeHex(node.name)

            // remove lowercase for BOTH? never one
            if (newColor.toLowerCase() !== node.name.toLowerCase()) {
              replaceNodeAt(parent.parts, index, createHexNode(newColor))
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
            var newColor = attemptMakeColorName(node.val)

            if (newColor.toLowerCase() !== node.val.toLowerCase()) {
              replaceNodeAt(parent.parts, index, createIdentifierNode(newColor))
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
            node.val = trimRedundantZeros(node.val)

          // removes 0(px)
          if (config.removeExcessUnits && node.val === "0")
            // Value
            if (parent.parts)
              replaceNodeAt(parent.parts, index, createNumberNode(0))
            // Function
            else if (parent.arguments)
              replaceNodeAt(parent.arguments, index, createNumberNode(0))
        }
      },

      ////////////////////////////////////////////////
      Number: {
        enter(node) {
          if (config.skipTrailingZero)
            node.val = trimRedundantZeros(node.val)
        }
      },

      ////////////////////////////////////////////////
      Dimension: {
        enter(node, parent, index) {
          // removes 0.1(00)
          if (config.skipTrailingZero)
             node.val = trimRedundantZeros(node.val)

          // removes 0(px)
          if (config.removeExcessUnits && node.val === "0")
            // Value
            if (parent.parts)
              replaceNodeAt(parent.parts, index, createNumberNode(0))
            // Function
            else if (parent.arguments)
              replaceNodeAt(parent.arguments, index, createNumberNode(0))

          // leading zeros, (000)1, auto removed by JS
        }
      }
  })

  return {
    ast,
    map: {
      keyframes:  mangledKeyframesMap,
      variables:  mangledCustomProps,
      namespaces: mangledNamespaceMap,
      selectors:  selectorMangler.getMangledNames()
    }
  }
}
