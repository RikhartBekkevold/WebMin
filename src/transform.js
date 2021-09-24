const { traverseParent } = require('./CSS-parser/src/traverse.js');

const {
  isSelectorList,
  isLonger,
  removeNode,
  getProperty,
  allPropertyValuesSame,
  sameValueExact,
  isFunctionSame,
  hasAllLonghandProps,
  isDatatypeDependantShorthandProp,
  isOrderDependantShorthandProp
} = require('./css-parser/src/treeUtil.js');

const {
  allValuesSame,
  removeDuplicates,
  canShortenHex,
  RGBToHex,
  replaceColorNameWithHexIfShorter,
  replaceHexValueWithColorNameIfShorter,
  trimRedundantZeros,
  getSelectorLen,
  getLengthOfAllDeclarations,
  getUnique,
  includesAll,
  propOverrides,
  mangleName,
  hasMangledNameBefore,
  createNameGenerator,
  switchPos
} = require('./css-parser/src/util.js');

const shorthandMap = require('./shorthandMap.js');


module.exports = function transformAST(ast, config) {
  var inKeyframe = false
  var inMedia = false
  var keyframes = []
  var animationDeclarations = []

  traverseParent(ast, {
    Stylesheet: {
      exit() {
        // as the very last thing we do, we mangle keyframe names. we do this at the end because the kf name can be referenced before its declaration.
        // we cant mangle propertynames witout preserving "--"?
        // mangle counter style name too
        if (!config.mangleKeyframeNames)
          return

        var map = Object.create(null)
        var getNextIdent = createNameGenerator()

        keyframes.forEach((kfNode, i) => {
          if (map[kfNode.name])
            return kfNode.name = map[kfNode.name]
          var newName = getNextIdent()
          map[kfNode.name] = newName
          kfNode.name = newName
        })


        animationDeclarations.forEach((declaration, i) => {
          declaration.value.parts.forEach((value) => {
            if (value.type === "Identifier" && map[value.name]) // in map. ident has name as prop - we filter all type not ident, so second check always works
              value.name = map[value.name] // not applied?
            else if (!map[value.name]) {
              // if the ani name is not a keyname (we handled ALL kf first)
              // make own name. this becaue even though its "useless", it does save characters
              // it uses the same map as kf though
              // good because saves chars,
              // remove the animation decl?? is entire invalid?
              var newName = getNextIdent()
              // this wont work if same ref appear many times, will create new name, not same, need another map?
              // if we delete this declaration, we can detect in seletor exit that selector is now empty, or detect
              // at end of enter?
              // problem is when there are several different visitors/nodes?
              value.name = newName

              // animation-name would invlaid name is useless. redundant. so we can remove.
              // animation is all invalid if name is? seeing as css usually invalidates the entire declaration til ;
              // can test if works mebbe

            }

            // mine work becasue we can assume that a ref that has same name as a kf name is animation. we trust the user.
            // how can i determine if slide-in ref witout kf can be transfomed then, given the mthod i currently use?

              // no matching name - translte genIdent anyway? saves sapce. next kf need to do next ident thouhg
          })
        })
      }
    },
    KeyframesRule: {
      enter(kfNode, parent, index, selPattern, arr, key) {
        inKeyframe = true
        if (config.mangleKeyframeNames) keyframes.push(kfNode)
      },
      exit(kfNode, parent, index, selPattern, arr, key) {
        inKeyframe = false

        if (config.removeEmptyAtRules && kfNode.arguments.length === 0) {
          arr.splice(index, 1)
          return true
        }
      }
    },

    MediaQueryList: {
      enter() {
        inMedia = true
      },
      exit(node, parent, index, selPattern, arr, key) {
        if (config.removeEmptyAtRules && node.selectors.length === 0) {
          arr.splice(index, 1)
          return true
        }
      }
    },
    ClassSelector: {
      enter(node, parent) {
        if (config.mangleNames) mangleName(node)
      }
    },
    IdSelector: {
      enter(node, parent) {
        if (config.mangleNames) mangleName(node)
      }
    },
    SelectorPattern: {
        enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {

          visitedSelectorPatterns.forEach((visitPattern, idx) => {
            var match = true
            if (node.selectors.length !== visitPattern.selectorPattern.selectors.length) {
              return
            }

            // is the sel patterns the same? same typ and name
            visitPattern.selectorPattern.selectors.forEach((visitedSelector, i) => {
              // HOW DO WE COMPARE ATTRRIBUTES? flag, value, attriname!!
              // make sure we compare correctly attribute selectors and maybe *
              if (node.selectors[i].type !== visitedSelector.type || node.selectors[i].name !== visitedSelector.name)
                match = false
            })

            if (match && config.mergeDupliSelectors) {
              var visitedNodeStatements = visitPattern.styleRule.rules.statements
              var nodeStatements = parent.rules.statements
              var allPropsOverridden = includesAll(visitedNodeStatements, nodeStatements, "property") // property not used for now
              var isPartOfList = isSelectorList(visitPattern.styleRule) // use let? or just same, since only once?

              if (!isPartOfList && allPropsOverridden && visitPattern.parentArr) { // or parent.type === "PageRule"
                let idx = visitPattern.parentArr.indexOf(visitPattern.styleRule) // removes entire keyFrames? we want only selector inside. so hardcoded ast.rules path dont work!
                var removed = visitPattern.parentArr.splice(idx, 1)
                return 2
              }
              else if (!isPartOfList && !allPropsOverridden) {
                for (var i = 0; i < visitedNodeStatements.length; i++) {
                  var statement = visitedNodeStatements[i]
                  // not all statements overriden, but find the ones that are, and delete them
                  if (nodeStatements.findIndex(item => propOverrides(item, statement)) !== -1)
                    visitedNodeStatements.splice(i--, 1)
                }
              }

              else if (isPartOfList && allPropsOverridden) {
                // we always in selpattern. and struct of stylerule is always same. hence why its OK to hardcode paths if we go DOWN?
                let idx = visitPattern.styleRule.selectors.indexOf(visitPattern.selectorPattern) // check index inside the ast. not in visitprpattenr. hence works.
                visitPattern.styleRule.selectors.splice(idx, 1)
                return true
              }

              else if (isPartOfList && !allPropsOverridden) {
                var nonOverriddenProps = getUnique(visitedNodeStatements, nodeStatements, "property") // property not used for now
                var selectorLongerThanDeclarations = isLonger(visitPattern.selectorPattern.selectors, nonOverriddenProps)

                if (selectorLongerThanDeclarations) {
                  let idx = visitPattern.styleRule.selectors.indexOf(visitPattern.selectorPattern)
                  visitPattern.styleRule.selectors.splice(idx, 1)

                  nonOverriddenProps.forEach((decl, i) => {
                    nodeStatements.push(decl)
                  })
                }

                return true
              }
            }
          })
        },
        exit(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
          // dont push here, if inside keyframe or media! that way we only compare selectors if they in rules
          // if (!inMedia && !inKeyframe) - if first check too?
          visitedSelectorPatterns.push({selectorPattern: node, styleRule: parent, arr, parentArr, ancestors})
        }
      },

    StyleRule: {
      enter(node, parent, index, selPattern, arr, key) {
        if (config.removeOverridenDeclarations) {
          // WE CANT REMOVE IF first declaration has IMPORTANT! should make pred - name && val && importnat
          node.rules.statements = removeDuplicates(node.rules.statements.reverse(), "property").reverse()

          for (var key in shorthandMap) {
            var order = shorthandMap[key].order
            var { index: indexOfShorthand, statement: shorthandProp } = getProperty(key, node.rules.statements)
            var hasShorthandProp = shorthandProp !== null

            if (hasShorthandProp) {
              for (var i = 0; i < indexOfShorthand; i++)
                if (order[node.rules.statements[i].property])
                  node.rules.statements.splice(i, 1), console.log("deleted node at index:", i);
            }
          }
        }

        if (config.removeEmptySelectors && node.rules.statements.length === 0) { // comment? not parsed for some, but for others
          // if one sel empty, it removes entire keyframes?
          // if (parent.type === "KeyframesRule")
          //   parent.arguments.splice(index, 1)
          // // keyframes trigger delete in the other? by ... ast rules
          // else

          arr.splice(index, 1)
          return true
        }


        // all longshands before its shorthand will be overwritten by the shorthand and is therefore redundant
        // (default value only matter in border SH?)
        if (config.longhandToShorthand) {
          for (var key in shorthandMap) {
            var longhands = []
            var subProperties = shorthandMap[key].subProperties
            var order = shorthandMap[key].order

            var { index: indexOfShorthand, statement: shorthandProp } = getProperty(key, node.rules.statements)
            var hasShorthandProp = shorthandProp !== null

            if (hasShorthandProp) {
              subProperties.forEach((prop, i) => {
                var { statement } = getProperty(prop, node.rules.statements, indexOfShorthand) // +1
                if (statement) longhands.push(statement)
              });

              // only do if actually has at least one longhand after (to prevent expanding then deflating again)
              if (longhands.length) {

                // expand the values into what CSS sees:
                if (isOrderDependantShorthandProp(shorthandProp.property)) {
                  if (shorthandProp.value.parts.length === 1)
                    shorthandProp.value.parts.push(shorthandProp.value.parts[0], shorthandProp.value.parts[0], shorthandProp.value.parts[0])
                  if (shorthandProp.value.parts.length === 2)
                    shorthandProp.value.parts.push(shorthandProp.value.parts[0], shorthandProp.value.parts[1])
                  if (shorthandProp.value.parts.length === 3)
                    shorthandProp.value.parts.push(shorthandProp.value.parts[1])

                  longhands.forEach((longhandProp) => {
                    // do we know we saved space?
                    // check length of each here before we remove/add?
                    // is this the only place we cant be sure result is shorter?
                    shorthandProp.value.parts.splice(order[longhandProp.property], 1, longhandProp.value.parts[0]) // we know only one value in longhand.. hence [0]
                    // remove the longhand AFTER margin
                    node.rules.statements.splice(node.rules.statements.indexOf(longhandProp), 1) // REPLACE indexof
                  })
                }
                else if (isDatatypeDependantShorthandProp(shorthandProp.property)) {
                  longhands.forEach((longhandProp) => {
                    // just pushing is ok here, for border, but fails for animation|background|font?
                    shorthandProp.value.parts.push(longhandProp.value.parts[0]) // we know only one value in longhand.. hencey [0] - assumes correct declaration format used, meaning only one value
                    node.rules.statements.splice(node.rules.statements.indexOf(longhandProp), 1)
                  })
                }
              }
            }
            // if dont have margin its ONLY safe to shorten if ALL longhand values are set, due to cascading?
            // if all subProperties is present, we know its safe to replace with a shorthand prop
            // if not its not safe, because there can be longhand properties declared in diff selectors
            // which (due to cascading?) is applying to the same element as targeted by the current selector
            // but will be overriden by default values as soon as we create a shorthand prop instead.
            // we either need to know these values or have all. we cant override with defualt values. not safe.

            // so: if ALL longhands (subprop) of a shorthand is present, it is safe to replace them with a shorthand.
            else if (!hasShorthandProp) { // any they are NOT dupli, which this implies by the way we find the longhands

              subProperties.forEach((prop, i) => { // foreach key? in?
                var { statement } = getProperty(prop, node.rules.statements)
                if (statement) longhands.push(statement)
              });

              var isAnyImportant = false

              for (var prop of longhands) {
                if (prop.important === true) {
                  isAnyImportant = true
                  break
                }
              }

              var allLonghandsPresent = longhands.length === subProperties.length && !isAnyImportant

              if (allLonghandsPresent) {
                var newNode = {
                  type: "Statement",
                  important: false,
                  property: key,
                  value: {
                    type: "Value",
                    parts: []
                  }
                }

                longhands.forEach((longhandProp) => {
                  // we looked for, and pushed in the same order we want to add to the new margin node - for border, order don't matter - for anim it does!
                  newNode.value.parts.push(longhandProp.value.parts[0]) // longhand always just have one value
                  node.rules.statements.splice(longhandProp, 1)
                })

                // add a new "margin" node to the end of the selector declarations, using the 4 shorthand values
                node.rules.statements.push(newNode)
              }
            }
          }
        }
      }
    },
    Statement: {
      enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
        if (config.shortenShortHand) {
          // we can shorten this type of shorthand property by seeing if we can achieve the same result with fewer values.
          if (isOrderDependantShorthandProp(node.property)) {
            // margin: 20px 20px; -> margin: 20px;
            if (node.value.parts.length === 2 && sameValueExact(node.value.parts[0], node.value.parts[1]))
               node.value.parts.splice(0, 1)

            // margin: 20px 30px 20px; -> margin: 20px 30px;
            // in BOTH the user-shorthand and our shortened-shorthand CSS is assuming the last (left) value is 30px! hence why safe to shorten.
            else if (node.value.parts.length === 3 && sameValueExact(node.value.parts[0], node.value.parts[2]))
               node.value.parts.splice(-1)

            // margin: 20px 20px 20px 20px; -> margin: 20px;
            else if (node.value.parts.length === 4 && allPropertyValuesSame(node.value.parts))
              node.value.parts.splice(1, 3)

            // margin: 20px 30px 20px 30px; -> margin: 20px 30px;
            // having this below allPropertyValuesSame makes sure it will only match in cases where pairs match, but the 4 values are not all the same value
            else if (node.value.parts.length === 4 && sameValueExact(node.value.parts[0], node.value.parts[2]) && sameValueExact(node.value.parts[1], node.value.parts[3]))
               node.value.parts.splice(0, 2)

            // margin: 50px 30px 60px 30px; -> margin: 50px 30px 60px;
            else if (node.value.parts.length === 4 && !sameValueExact(node.value.parts[0], node.value.parts[2]) && sameValueExact(node.value.parts[1], node.value.parts[3]))
                node.value.parts.splice(-1)
          }


          // finds the ideal arrangment of values so that the least amount of space (characters) is needed to separate them
          // TODO: not perfect, create steps to fix|optimize value arrangement (or use a map with info?)
          if (isDatatypeDependantShorthandProp(node.property)) {
            var lastIndex = node.value.parts.length-1
            if (node.value.parts[lastIndex].type === "Percentage" || node.value.parts[lastIndex].type === "Function") { // we know that codegen will remove spacing. so if at end, missed oppertunity. have a diff value at end.
              var index = node.value.parts.findIndex((value) => value.type !== "Percentage" && value.type !== "Function")
              if (index !== -1) switchPos(node.value.parts, index, lastIndex)
              // if we moved percent to front, now maybe function is last? arr.length checks? allIs? - find the one that CAN be last and make last? if last is percent or fn?
              // if there is non, dont move
              // thats what we do. we move the index sure, but we always add a value behind that isnt percent or fn!
            }

            var firstIndex = 0
            if (node.value.parts[firstIndex].type === "Hex") {
              var index = node.value.parts.findIndex((value) => value.type !== "Hex") // findLastIndex - reverse array. since we just return - api fns never eff, make own
              if (index !== -1) switchPos(node.value.parts, index, firstIndex)
            }
          }
        }

      // attempt fix step - if FIND any matching pairs (specific per/fn-hex order) then split them (move) if can. do this for ALL. if splitting one, made other impossible,
      // dont do it. each split can either succeed or not.

      //   loop - normal for?
      //     if fn || percent is followed by hex
      //         then move how? (alters curr array index (only if move behind us)) - use swtich fn? just index, index+1? if not last - use findIndex here?
      //
      //
      // // tries to minimize the spacing needed between values
      // optimizeSpacing()
      // minimizeSpacingBetweenValues()
        // if end delim and front delim align - chars next to eachother - which they are in those two possible combiantions - do we waste a space
        // if find any AFTER, from there (new array create? easiest way to index skip?) that would nto create the combi, replace?
        // map about how interact - used for move decisions - aka ifs in loop - how many loop steps? garan prev state vs all decisions at once

        if (config.mangleKeyframeNames && (node.property === "animation" || node.property === "animation-name"))
          animationDeclarations.push(node)
      }
    },
      Function: {
        enter(node, parent) {
          // isRGBA()
          //   return node.type === "ident" && node.name === "rgb" || node.name === "rgba"
          if ((node.name === "rgb" || node.name === "rgba") && config.replaceRgbWithHex) {
            // calc the resulting length after, to see if longer?
            // or is hex ALWASY shorter? yes.. regardless of combo
            node.type = "Hex"
            node.val = RGBToHex(Number(node.arguments[0].val), Number(node.arguments[1].val), Number(node.arguments[2].val))
            delete node.name
            delete node.arguments
          }
        }
      },
      Identifier: {
        enter(node, parent) {
          if (config.useShortestColorValue && parent.type === "Value") {
            var newColor = replaceColorNameWithHexIfShorter(node.name)
            if (newColor !== node.name.toLowerCase()) {
              node.type = "Hex"
              delete node.name
              node.val = newColor
              return
            }
          }
        }
      },
      Hex: {
        enter(node, parent) {
          if (config.useShortestColorValue && parent.type === "Value") {
            var newColor = replaceHexValueWithColorNameIfShorter(node.val)
            if (newColor !== node.val.toLowerCase()) {
              node.type = "Identifier"
              delete node.val
              node.name = newColor
              return
            }
          }
          // if (node.val.length === 6 && (everySame(node.val) || everySecondSame(node.val))) // doubt i need ()
          if (node.val.length === 6 && canShortenHex(node.val)) // canShortenHex - hexIsCutable
            return node.val = node.val[0] + node.val[2] + node.val[4] // assumes 6 and 3 pairs/3 duplicates
            // check if hex to color name also!
            // deal with alpha - hasAlpha() => 8 chars or 4?
        }
      },
      Percentage: {
        enter(node) {
          if (config.skipTrailingZero)
            node.val = trimRedundantZeros(node.val)
        }
      },
      Number: {
        enter(node) {
          if (config.skipTrailingZero)
            node.val = trimRedundantZeros(node.val)
        }
      },
      Dimension: {
        enter(node, parent) {
          if (config.skipTrailingZero)
             node.val = trimRedundantZeros(node.val)
          if (config.removeExcessUnits && node.val === "0") {
            node.type = "Number"
            delete node.unit
          }
        }
      }
  })
  return ast
}
