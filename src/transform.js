const { traverseParent } = require('./CSS-parser/src/traverse.js');
const { isSelectorList, isLonger, removeNode } = require('./css-parser/src/treeUtil.js');
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
  createNameGenerator
} = require('./css-parser/src/util.js');


module.exports = function transformAST(ast, config) {
  var inKeyframe = false
  var inMedia = false
  var keyframes = []
  var animationDeclarations = []

  traverseParent(ast, {
    Stylesheet: {
      // is all the names we create aa etc safe?
      // as the very last thing we do, we mangle keyframe names. we do this at the end because the kf name can be referenced before its declaration.
      // mangle keyframe names is safe even witout html!
      // if anim name used dont match a keyframes what happnes?

      // animation list in parts - can have many names for kf?
      // poarseKeyFrameSelectors - its own fn, exactly same, that has specific parse fns?

      // use the ones there are more of to pic single letter!
      // overrides. so we only have one map prop

      exit() {
        // we cant mangle propertynames witout preserving "--"?
        // mangle counter style name too
        if (!config.mangleKeyframeNames)
          return

        var map = Object.create({})
        var getNextIdent = createNameGenerator()

        keyframes.forEach((kfNode, i) => {
          // instead of overriding, we just use the name for the keyframe (now we still only get one prop. but this time "a", and all keyframe that name)
          // the declarations will still all have one name: "a".
          if (map[kfNode.name])
            return kfNode.name = map[kfNode.name]
          // mangle or gen new name - use mangle since will give same name to same. genident will give diff name sicne dont check, assumes all keyframes are unik named
          // will cuse map conflict instead? overriding?
          var newName = getNextIdent()
          map[kfNode.name] = newName
          kfNode.name = newName
        })

        // animation name can be manglec witout html. since we only use it in animation prop!!!

        // check if exists in map first
        // then use that name, and not gen ident - the reason beeing that all keyframes will get same name
        // all have same name should be the case. but all the others should  have same name too? not diff? same res? or does css use first?
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
              // why d?

              // animation-name would invlaid name is useless. redundant. so we can remove.
              // animation is all invalid if name is? seeing as css usually invalidates the entire declaration til ;
              // can test if works mebbe

            }
            // must go by order? cant?
            // source map
            // unit test - kf
            // html parser

            // mine work becasue we can assume that a ref that has same name as a kf name is animation. we trust the user.
            // how can i determine if slide-in ref witout kf can be transfomed then, given the mthod i currently use?


              // no matching name - translte genIdent anyway? saves sapce. next kf need to do next ident thouhg

          })
        })

        // makeMap fn, that also return not fn, but iteraction fns aswell


        // makes it b, and dont change the one that doenst exist kf of

        // ref with no kf name that is same = stays same
        // kf with no ref used, gets mangled, even if not used
        // so next valid would get eg c - at worst wasted? nah

        // kf unit tests:

        // even though slide-out isnt ref, css will ignore it, so we should trnaslt eit+
        // if ref, but no matching kf name. still translate (after?) if value and


        // can we accidently gen a name that isnt safe?
        // order as identifcaiton, not name

        // dont delete cross differnt keyframes or diff media (unless same name?)


        // since only kf, we ignore prefix

        // deelte node with empty array on exit always
        // do any form of deleting based on empty array in different nodes exit fn
      }
    },
    KeyframesRule: {
      enter(kfNode, parent, index, selPattern, arr, key) {
        inKeyframe = true // only after delete?
        if (config.mangleKeyframeNames) keyframes.push(kfNode)
      },
      exit(kfNode, parent, index, selPattern, arr, key) {
        // empty at rules are always in
        // this return is when we loop toplevel|stylesheet?
        inKeyframe = false

        // mangleKeyframeName - customIdent names
        // if (config.mangleNames)
        //   mangleName(node) // node.name exists for kf too
          // need to call manglename for ident too then? in values? if value, AND custom ident!! or.. if OLD name exists in map. then we assume its from kf|custom!
          // parseCustomIdent? if not a part of list?
          // tokenize variables
          // push() to map (own map, since can prob have smae name as class?)


        // isEmpty(arr)
        // what difference does it really make to do this at exit? end of enter just as well? since we still need to have the if?
        if (config.removeEmptyAtRules && kfNode.arguments.length === 0) {
          // arr = ast.rules
          arr.splice(index, 1) // calc indexOf self, ot get passed, by loop, then we tell loop back to decreease index
          return true // tell to --i - return "operationtype", which can be used for complex loop logic. the visitor alter loop.
        }
      }
    },

    MediaQueryList: {
      enter() {
        inMedia = true
      },
      // why does below not cause error now?
      // not err becaseu not duplicate? or was the err just misplaced return?
      // wrong visit = next(2) steps?
      exit(node, parent, index, selPattern, arr, key) {
        // if (isEmpty) remove(arr)

        // this removes on exit. so if we deleted all the statements and selectors, this would on exit understand it needs to delete itself.
        // hence we dont need code below? we do only to match external sel? and init same respons, since we might be past the mediaquery
        // when it/this becomes empty? in another query then? but px is diff? so not safe to del? and outside it isnt either?
        if (config.removeEmptyAtRules && node.selectors.length === 0) {
          // arr = ast.rules = parent.rules
          arr.splice(index, 1) // calc indexOf self, ot get passed, by loop, then we tell loop back to decreease index
          return true // tell to --i - return "operationtype", which can be used for complex loop logic. the visitor alter loop.
        }
      }
    },
    // Object.prototpye.slice.toString, in, instanceof, constrctor, constrctor.name, typeof/(), hasOwnProperty,

    ClassSelector: {
      enter(node, parent) {
        // pass is more eff? its priv thouhg
        if (config.mangleNames) mangleName(node)
      }
    },
    // "Mangle class and id selector names"
    IdSelector: {
      enter(node, parent) {
        if (config.mangleNames) mangleName(node)
      }
    },
    SelectorPattern: {
        enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
          // FOR NOW WE disable merging the delcarations of dupli selectors (aka decl merge cross selectors)
          // this is a problem because of the space between. we can merge dupli. but if it result in src sel
          // having NO, we removee it completely.. but media and keyframes will not be removed?

          // same name arr, vs

          // Merging dupli delc in diff selectors dont work when inside keyframe|media, due to arr being different. we directly ref ast.rules. but we are in ast.rules.selectors|arguments
          // This will also cause the problem that when we remove the declarations, in the case we, in src, then end up with empty
          // empty sel, and only one sel, removed, then

          // problem: we only know we can delete in another node
          // doing on exit wont do, since the problem is we already past the node and in a later node. we need to have ref to it. sowe can remove parnet. so: we check if
          // parent is keyframerule, MediaQueryList, and if so, and if empty, we delete parent too?

          // first replace arr, aka splice of parent (current node)
          // then we make sure we have ref to visit parent too, and check its type, and if ITS array is empty after we deleted decl and/or selectors, then
          // we delete parent too (need ref to ast.rule or ITS parent too for deletion)


          // this last is why we need tests? we can see it didnt delete thouhg? keyframe, even if selector

          // ENABLE EVENTUALLY
          // having dupli selectors in keyframs is probably rare. might be more common to have empty keyframe?
          // if keyframe is empty, remove. how? since it will remove style. removeAtRule is its own code?

          // if (inKeyframe)
          //   return


        // can pass down, or set via visitors like now
        // if (!inMedia && !inKeyframe) - if not first check too?
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


            // does it merge cross array? or this all assuem ast rules actually
            // parent - ancestors
            // set flag inKeyframe - not ancestor

            if (match && config.mergeDupliSelectors) {
              var visitedNodeStatements = visitPattern.styleRule.rules.statements
              var nodeStatements = parent.rules.statements
              var allPropsOverridden = includesAll(visitedNodeStatements, nodeStatements, "property") // property not used for now
              var isPartOfList = isSelectorList(visitPattern.styleRule) // use let? or just same, since only once?

              // we delete in selpattern the stylerule, but want to go back in stylerule loop
              // need to find a way to pass up so we can affect i-- in the correct loop

              // does retuning oir of THIS NODE, saying to go back one work?   yes
              // sel pattern is localizezd thouhg?



              // adding  && visitPattern.parentArr fixes the bug when selectorpattern is in page rule (only in page rule at rile it exists)
              // and the parentArr dont exists, its and object (styleRule) and not array. in other words: we need to not compare sel patterns
              // when they part of pagerule?
              // is visitPattern.parentArr check here good enouhg? works for all scenarios?
              if (!isPartOfList && allPropsOverridden && visitPattern.parentArr) { // or parent.type === "PageRule"
                // ast.rules assumes we are in toplevel. in the case of keyframes we are not - do it relative to parent arr instead
                // we now have passed parent arr. so only matter of swtiching method? same as we did below? where we used splice on arr
                // use ancestor path then?

                // this is visited nodes arr. which is what we wnat to delte. we are comparing to. we push into visited even when sel in keyframe etc
                // var idx = arr.indexOf(visitPattern.styleRule)
                // // need to calcl, unless we save index ofc - index not always safe, since we cna have changed. so it "safer" to calc?
                // arr.splice(idx, 1)

                // we cant get the parent arr in here, when visit node, we can only get it if we save parent arr in traverse. which we can get in base fn args? dont just save parent
                // - we can save name in prop, like type?
                // if (parent.type === "KeyframesRule")  // parent = StyleRule, not Keyframe! so this method wouldnt work!?
                //   ast.arguments.splice(idx, 1)
                // if (parent.type === "MediaQueryList")
                //   ast.selectors.splice(idx, 1)
                // if (parent.type === "Stylesheet")
                //   ast.rules.splice(idx, 1)

                // for styleRule in pages, its not arr, but object
                // does parse as complex in pages - but transform transform/remvoes/splices complex node!?
                // should work for normal place? it does. prev pages, fucked it.

                // comment out other/no change, check if this works for kf and media. then do ancestors.
                // console.log(visitPattern);
                let idx = visitPattern.parentArr.indexOf(visitPattern.styleRule) // removes entire keyFrames? we want only selector inside. so hardcoded ast.rules path dont work!
                var removed = visitPattern.parentArr.splice(idx, 1)
                // console.log("Removed", removed);
                return 2

                // ast.rules || keyframes.arguments


                // shift selector pattern?
                // if we delete FORM sel pattenr, we shift the pattern, not style?


                // dont remove outside selectors matchinng own scope (if or diff vsited arr pass). not safe. or.. check px|keyframes names?
                // remove all selectors - delete all app - sequnmce break?
                // de decrementing wrong i?


                // this can NEVER cause empty?? only ouside? only when we delete empty selector can we get empty kf?
                // it deletes selector, but can never delete both, that can only happen outside? or if both already empty???


                // return, move to stylerule, parent arr|key, each nod del itself, and node detect if its array is empty on exit,

                // dissalow the deletion of a selector, if one of the selectors has a different parent type (scope) since a media will override other if below, but
                // isnt applied to ALL same scenarios (screens)
                // if (visitPattern.parentArr.type !== this node)
                // parent type the same isnt enouhg. need to be exactly the same obj/parent vistied.parr == node.parr

                // we need to push each time? or do we pop selpattern? when we leave kf|media|ss? then we only get visit for each scope? since rec we dont remove
                // when go back out? since we create different ..?
                // need to create different arrays in each traverse fn? or in each base fn? else we compare to ALL before still?







                // var parentArr = visitPattern.ancestors[i-1].node.type // dont really need to push arr then? since getting parent of parent is easy. so getting arr is too? no! since dont have name|key? we only have the arr when we loop! thats been the problem all the time. we can if we pass key ofc

                // we in enter so last in ancestor is prev node - aka parent
                // var last = visitPattern.ancestors.length-1
                // var parent = visitPattern.ancestors[last-1].node//.arr  // old ref?
                // parent.arr.splice(idx, 1)



                // AFTER we deleted stylrule. now check if parent (kf, media, ss) have become empty. if so delete it too!

                // parent.arr and not parentsParents.arr?
                // did the array we deleted selector from (kf.arguments, media.selectors or ast.rules become empty?)
                // if so, delete that node too (deletes entire ast tree if no sel left, deletes only keyframe or media query if inside those)
                // after we delete selector from parent(stylerules) container array (kf,media,ss(eg. rules)), is it now empty?
                // if so, we get the parentsParents array, and delete it too (this will delete ast.rules array) - this assumes there is one more node with array (if not undefined lookup?)
                // we assume deleting empty is good. becaue a: user flag, b: where we are (selpattern)
                // parents parent ALWAYS exists. but can be 1 of 3 possible parents.
                // we also assume all 3 parents are nodes in arrays, and not props.
                // reusable method? since we might want to delete parent of array if empty in other situations? when its a potential side effect - removeParnet() {remove(parnet)}
                // if (parent.arr.length === 0) { // only make sense becasue we HCEKC after delete. if 0 parne tof parent fetch wouldnt even make sense!
                //   // if parr exists first? it always does if we in sel pattern and legal css.
                //   // grandParent - kf|media|ss
                //   var parentsParent = visitPattern.ancestors[last-2].node        // container tree siblings
                //   // after we deleted entire stylerule, we check if parnet (keyframe|media|stylesheet) is now empty, if so, we delete that one too
                //   var idx = parentsParent.arr.indexOf(parentsParent) // aka .node  // two structs ref same in mem, in different formats
                //   // we then delete the parent, that now has empty array, from THEIR array, on the assumption it is not needed anymore with empty array (since we only call for selpattern?
                //   // so we assume we have the right syntax?)
                //   parentsParent.arr.splice(idx, 1)
                //   // return delete?
                // }

                // if nodes array is empty. delete it.
                // if useless delete - check if needed
                // if other node - then need to delete when?

                // cleaner,simpler?



                // visitPattern = prevVisitedPattern
                // let idx = ast.rules.indexOf(visitPattern.styleRule) // removes entire keyFrames? we want only selector inside. so hardcoded ast.rules path dont work!
                // // replace with arr? or ancestor path?
                // // remove next becasues?
                // ast.rules.splice(idx, 1)
              }
              else if (!isPartOfList && !allPropsOverridden) {
                for (var i = 0; i < visitedNodeStatements.length; i++) {
                  var statement = visitedNodeStatements[i]

                  // not all statements overriden, but find the ones that are, and delete them
                  if (nodeStatements.findIndex(item => propOverrides(item, statement)) !== -1)
                    visitedNodeStatements.splice(i--, 1)
                    // visitPattern.styleRule.rules.statements.splice(i--, 1)
                }
              }
              // item => item.property === statement.property
              // && item.value.parts.length === statement.value.parts.length
              // && (item.isImportant || !statement.isImportant)) !== -1

              // onbly do if prop type is shorthand? in parse add info to prop? like iShorthand from map. or just read map here? brackey lookupo
              // only delete first, as long as first isnt the only one with important (beats ANY spec? dont matter here thouh gofc)

              // delete selectorpattern!
              else if (isPartOfList && allPropsOverridden) {
                // we always in selpattern. and struct of stylerule is always same. hence why its OK to hardcode paths if we go DOWN?
                let idx = visitPattern.styleRule.selectors.indexOf(visitPattern.selectorPattern) // check index inside the ast. not in visitprpattenr. hence works.
                visitPattern.styleRule.selectors.splice(idx, 1)
                return true
                //
                // visitedSelectorPatterns.push({selectorPattern: node, styleRule: parent, arr, parentArr})

                // dont work becauyse we are pushing sel pattenr, not stylerule? so visitPattern.parent is waht we need?
                // explains why this doenst make sense! we don delete stylerule, we delete sel pattern!
                // arr = StyleRule.selectors
                // can keep the above, sicne this is ALWATS stylerule.selectors?
                // in acnestor, gettign parent of parent is throuhg sequence! so one less index = parent of parent

                // let idx = visitPattern.arr.indexOf(visitPattern.selectorPattern) // check index inside the ast. not in visitprpattenr. hence works.
                // visitPattern.arr.splice(idx, 1)

                // still need to tell both stylerule? nah since not loopin git? traverser is! so hasRemoved and reutrn here, inside base selpattern?
                // same goes for removing in keyframes, media and stylesheet?
                // we need to tell the one that is currently getting each selpattern (nah! becase we only op on prev selpattenr? we past it? if
                // we updates this selpattern node we would need to? is it wrong to return - thouhg? yes! becaye we tell current sel pattenr loop
                // that we want to go back for deleting on another selpattenr node!)

                // we dont RETURN here!
                // we dont return here. is that the cause of the problems?!!
                // no becseu we only remove one? but we return in this node later?

                // do we del properly media|keyframes if we deleted their selectors later? can we trigger that deletion too?
                // do prev ketframes|meida which has the visited selector, now deleted, know how to remove keyframe to? that needs to be a trigger, but we past the keyframe node
                // . so check when we delete in first if, if we inside a keyframe, if the parent of parent is keytfrmae? the thing we just deleted from.. so.. we do need ancestor?
                // had we been in stylerule we wouldnt need parent of parent. only parent. so move down? or find a way to pass/calc parnet of parent. both goes in first if thouhg?
                // parent of parent pass, ancehstor pass (sequence, and we can pop!), move to stylrule and keep parent, which is now parents parent here.
                // visitPattern has ancestor so we need to push below
              }

              // need to do mangling first, if enabled? before we do this test?
              else if (isPartOfList && !allPropsOverridden) {
                // get the ones unique in visit sel
                // the props in visit, that dont appear in node
                var nonOverriddenProps = getUnique(visitedNodeStatements, nodeStatements, "property") // property not used for now
                // TODO: Do decl vs selpattern length test after mangle? DO AFTER MANGLE.
                var selectorLongerThanDeclarations = isLonger(visitPattern.selectorPattern.selectors, nonOverriddenProps)
                // down we always know the names? up we dont always?

                // config.mangleName - mangle first? and shorthand decl too.
                // or just prevent this entire thing if mangle = true?
                // mangling names and 20 20 to 20
                if (selectorLongerThanDeclarations) { // superflousDeclarations
                  // deleteSelPattern()
                  // delete the selector pattern
                  let idx = visitPattern.styleRule.selectors.indexOf(visitPattern.selectorPattern)
                  visitPattern.styleRule.selectors.splice(idx, 1)

                  // let idx = visitPattern.arr.indexOf(visitPattern.selectorPattern) // check index inside the ast. not in visitprpattenr. hence works.
                  // visitPattern.arr.splice(idx, 1)

                  // add the declarations in first to the second
                  nonOverriddenProps.forEach((decl, i) => {
                    nodeStatements.push(decl) // copies ref. safe?
                    // parent.rules.statements.push(decl) // copies ref. safe?
                  })
                }

                return true // deleted selector pattern event signal
              }
            }
          })


          // visitedSelectorPatterns.forEach((visitedNode, i) => {
          //  var higher = hasHigherSpec(node, visitedNode.selectorPattern)
          // console.log("Has higher precedence: ", hasHigherPrecedence(node, visitedNode.selectorPattern))
          // })
        },
        exit(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {

          // dont push here, if inside keyframe or media! that way we only compare selectors if they in rules
          // wont push aka comapre, to keyframes
          // need to also prevent compare? cant compare if either, not push nor comapre, if inside keyframe or media
          // ["rules"|"arguments"|"selectors"]

          // if (!inMedia && !inKeyframe) - if first check too?
            visitedSelectorPatterns.push({selectorPattern: node, styleRule: parent, arr, parentArr, ancestors}) // parnets parnet? indexOf?
        }
      },

    // this runs before selpattern, so if empty selector, we remove first here
    StyleRule: {
      // conflict here with sel pattenr being called after del? we do sel pattern after.. we dont go back after delete!!?!! that is.. only when we in ast rule!
      // media is removed when keyframes fails?!!
      // make exit? only if we delete values? transform values can alter decision, but not currently.

      // exit? dont look down? just check if we can delete in smallest, and then if array is empty in parent? or check in
      // parent in exit if its hardocded array is EMPTY!? for the arrays we want.
      // we need info in other nodes|parents|children to know we can delete?
      enter(node, parent, index, selPattern, arr, key) {
        // we know dupli is deleted. except diff length sh
        // that can cause problems - if this is first and not second sh margin we met for example
        // assume one sh for now (then find way to remove dupli. or we merge them! should be done here?)
        // if (isShorthand(node.prop) && diff length|cant remove one)
          // mergeDupliShorthnad() // take the props of each ( the last the longest| the last, and merge)
            // keep last (of multi) then add the diff length prop to it, and delete first
            // then we removed dupli! but after we

            // if nsh its safe to assuem same number of values, even if val type is diff - so we can just remove first
        if (config.mergeDuplicateDeclarations) // mergeOverridenDeclarations
          // loop from behind instead of reverse. filter cant, so replace with for loop?
          // WE CANT REMOVE IF first declaration has IMPORTANT! should make pred - name && val && importnat

          // make the remoe duplicates go backwards instead
          node.rules.statements = removeDuplicates(node.rules.statements.reverse(), "property").reverse() // will only remove margin and margin and not margin top
          // if same length. (or last longer?) and if both importnat or last. style dont matter for selector. we will just
          // apply that later. winnign sel is winnin sel.

          // IF SAME LENGHT OR the last is longer?
          // isEqual() are two declarations equal?




        // dont need to ehck len becase  they are alwys same if same prop! if diff len, not same prop.. ah! unless shorthnad
        // if shortHand prop also check same lenght - else dont bother
        // if one have importnat, they not equal

        // if (isEmpty(node))
        //   deleteNode()


        // is dec overriden in another sel? then we remove - that happens after thsi remove. so rearrange order by ALSO moving this to exit?

        // console.log(node.selectors[0].selectors[0].name, node.rules.statements);

        // DO ON EXIT?
        if (config.removeEmptySelectors && node.rules.statements.length === 0) { // comment? not parsed for some, but for others
          // console.log(parent);
          // if one sel empty, it removes entire keyframes?
          // if (parent.type === "KeyframesRule")
          //   parent.arguments.splice(index, 1)
          // // keyframes trigger delete in the other? by ... ast rules
          // else

          // this returned i assumes toplevel? thats the loop we go back in? since we in stylerule and assume its in toplevel,
          // so

          arr.splice(index, 1) // calc indexOf self, ot get passed, by loop, then we tell loop back to decreease index
          return true // tell to --i - return "operationtype", which can be used for complex loop logic. the visitor alter loop.
        }
          // we dont need to pass index, as long as we have obj/node ref to where in the ast it is
          // instead of passing index, we can get it here. slower thouhg
          // parent.rules.indexOf(node) // find its pos by ref in parent arr
          // learned aobut because of indexOf polyfill and vue? :)

// no double ?
// shorthand even thouhg it has "-"!
// hardcode and use instead? list of shortand props?

// "list-style": ["type" "position" "image"]
// "margin": ["top", "right", "bottom", "left"]
// if margin or list style




          // check all margin props existence. aka all props with same prefix. then keep in map bakcground: prop1 prop2 prop3 order

          // prop:
          //   name
          //   order
          //
          // if has("-")|is
          //
          //
          //   top 1, bottom 3, left 4, right 2 - margin: subprops: {top} - arr order = sh order
          //   those 4 in margin! so 4 plus shorthand, with order!
          //   creating rela: json and cut/replace (not in right array format, can just delete props) or manually enter
          //   or auto take all with name- and link - do we ahve order in decl?
          //
          //   algo when have data:
          //     find all properties|decl in block (if in other decl too!) - rx? margin-(top|bottom) -
          //
          //     the declarations vs the rela struct
          //
          //     create map|push array like visited of all styles that apply to an element? or selector..
          //     one more transfomer step?
          //
          //     bacgrkound and margin should be the same - top specifically shouldnt matter
          //
          //     how to deal with declararations for top etc being in a diff selector|block?
          //     do the link together transformation first? make sure in one format before do (same as changing str to a diff format?)... only way to make sure. is to loop again after step done?
          //     sometimes this necessary? only one visitor.
          //
          //     seems we can do it after one fn anway?
          //
          //     includes("-")
          //
          //     margin: ["top", "left", "bottom", "right"]
          //     has("top")? assume it exists - legal css - so we can use map [right]? since we know it will exists - so need to be legal in the props it has too
          //     assumes we have mapof ALL legal decl?
          //
          //
          //     foreach statements
          //       if (has("-"))
          //         split|parseSammensatProp("margin-bottom")
          //         take left and match with map[margin][right]
          //
          //         getOrder|placement(key)
          //           return map[key].indexOf(right) // if -1 we
          //
          //         assemble by logic
          //         check if length smaller - lenghtOfDeclarations
          //         if length not smaller
          //           discard
          //
          //         hasShorthand() // do we have the shorthand version? aka left - group together?
          //
          //         if shorthand
          //           get parent[key|arr] statements that has "-" and starts with prop name
          //           getStatments(arr, "margin") // two util fns!
          //           getVarationsStatments(arr, "margin") // only gets those that has("-") && split().left == margin
          //           getStatments(parent[key])
          //           getStatments(parent.statements) // parnet = block
          //           // easy to pass "statements" down, or hardcode here
          //
          //           getValues - link to map to know meaning
          //
          //           now with map we have all info to decide with ifs
          //
          //           perform action - delete - nothing - check length (to know its shorter. when can we know witout checking?) - dicard
          //           same valus. so val len dont matter. just skiping prop vs not - so always shorter?
          //           need to kno WHERE to insrt node (change|createnode). where the statements are does matter!
          //
          //
          //           // this will mess with loop alot if splice many in random order. be careful.
          //
          //           have to figure otu which combinations are legal - how shorthands work. test?
          //           make examples. use logic u would use to make a change
          //
          //
          //           get the value, how many values? that helps order as per map arr - mmeber: stuct of data = maintined info|get info
          //           get what nsh values are in values - link them to array
          //           the top, bottom order, is ALSO value order in sh. so easy to link.
          //           get valus, link to arr, then we know what values we missing, look for them, if find apply to shorthand, else
          //
          //           if sh = 2, its both
          //           im guessing last missed its 0?
          //
          //           get the others
          //           use the logic map to determine how to assemble new
          //           delete the statemnts dont need and create new|rechange sh
          //
          //
          //         if 4 non shorthand and not sh
          //           create shorthand with the 2 values.
          //
          //
          //
          //         we know:
          //           shorthnad all values or 1, in order
          //           can have combo of sh and nsh
          //
          //
          //
          //         limited to only same selector
          //
          //
          //       sketcy that he copied
          //       and didnt know how work
          //
          //
          //
          //       shortenProps - creates a shorter version of the prop - margin: 20px 20px; -> margin: 20px;
          //       mergeComplex - takes all the - props and change them to shorthand prop - only works if: has all 4, or 2. or sh with one of the other as combo.
          //
          //       margin:20px;margin-bottom:10px;
          //       ->
          //       margin:20px 20px 10px 20px;
          //       margin:20px 20px 10px; // last assume 20? or 0?
          //       need to cacl string, with sapce, aka, lenght of decrlarion, to be able to know if smaller. use same fn?
          //
          //       usually saves newline too. but when minified we dont have to care
          //
          //       perform transform, then check AFTER if shorter and choose to discard to go through with. instead of calc just do it and discard.
          //
          //       i can shorten 20%20px, but not px. why? is 20%20 safe?
          //
      }
    }, // config.useShorthandProp (not value!)
    Statement: {
      enter(node, parent) { // dont need to assign node to somethign else. just change arg! node -> currStatement
        // if we changed the name, eg animation-name to animation, it might not match? it does! since we need to keep orginal name ofc.
        if (config.mangleKeyframeNames && (node.property === "animation" || node.property === "animation-name"))
          animationDeclarations.push(node) // does change the obj in mem? but ast dont have ref anymore, so never added to output string?

          // decl is delete, need to delete here too?
          // when sel is deleted,

          // bug: when delete selector, skips next, so it never gets its name pushed
          // so, dont --?

          // try 2 diff kf - both which is refered
          // try kf when not used/ref
          // try anim name, not in kf arr/map

          // delete not cross all keyframes and selector. just within scope. global, or kf/media is considered scope.
          // now it accidentally deletes other from/to in other keyframes because the name clashes (since it doesnt check if keyframe names are same! just selector names)
          // same happens for media
          // delete only at exit? check its array length for specific visitors then?
          // cant delete empty if passed it (aka comparing selectors)
          // need to call agian the check to delete after we deleted a statement? was it the last? why, because of exit?
          // never the last?

          // cascading

          // checking against units only to know how to limit mistakes.
          // tokenize variables


          // var properties = [
            // {
            //   property: "animation",
            //   subprops: [
            //     "animation-name",
            //     "animation-duration",
            //     "animation-timing-function",
            //     "animation-delay",
            //     "animation-iteration-count",
            //     "animation-direction",
            //     "animation-fill-mode",
            //     "animation-play-state"
            //   ]
            // }
          // ]

        // this replaces margin with - which only works for first - sh and first nsh
        const map = require('./propMap.js') // first time run. then catched?
        if (config.useSmallerDeclarations && map[node.property]) {
          node.property = map[node.property] // simple map. no logic. hardcoded replace value.
        }




        // CSS ALL PROPERTIES: loop json, extract only prop wnat when loop, and push to new object

        // caant fill in missing
        // only to has doulve shorhand - only direceton props?
        //
        // // higher node = diff step
        //
        // // assuem not webkit - expand isSHorthand to exlcude webkit
        // // when we meet a shorthand (first) we make sure to check if inefficient nsh has been used
        // if (isShorthand(node.prop))
        //   // getStatments()
        //   parent.statements.forEach((statement, i) => {
        //     // prop is a non shothand version of our shorthand prop
        //     if (!isShorthand(statement.prop) && parsePropName(statement.prop))
        //       // does shorthand have?
        //
        //       push(statement, i) // need to delete. delete by ref? index? if delete one at a time its safe with splice --i?
        //       // i and order pushed helps us know which has prio. in case of
        //       // merge samem the first - dupl is removed in
        //
        //   });
        //     // hasWahtOtherHas(sh has nsh)
        //
        //   // loop selector and group all those who belong? then go throuhg each index and do ur best?
        //   // in style rule then. or for each statment. what ever we meet first sh or nsh, becomes the decider?
        //   //
        //   // getVariationDeclarations()
        //     // if (shorthand == || left == prop.name)
        //   // save org state and
        //
        //   // loop and when hit prop, check if added to dt, if not add, if same, else
        //   // in style wont affect loop either? adn can be done after dupli
        //   // loop once to group|new dt. then loop new dt once for each group. which requires sub loop?
        //
        //   // safe to loop rest after? yes, cant be before sinec then that would have been trigger for this
        //   // if dont delete, the next will still match prev,
        //
        //   // statment only when want to shorten prop?
        //
        //
        //   // then which statement we get first dont matter - we have all comboes. we use the ones that belong and try to decide best course of action. if some can be shortened.
        //   // within same selector its safe, even if override later.
        //
        //
        //   // push temp or when we meet? util fn? get
        //
        //   // if we have bakground-color we want to make it into background! even if we dont have background! we need to look for bg-color not bg.
        //
        //   // make decisions based on aquired props
        //   if 4 and non shorthnd
        //     // create new, or change one (is there props in between? dont matter. only order of sel, and saem type prop)
        //     // delete all,a nd add margin
        //   if 4 and shorthnd
        //     // use margin - delete rest
        //
        //
        //   // perform action based on choosen decision
        //
        //
        // // get root name - getPrefixName
        // function parsePropName(str) {
        //   return str.slice(0, str.indexOf("-")) // gets first only - always skip 2 first?
        // }
        //
        // // rx [-^-] or -{1}
        // var isShorthand = (str) => // webkit, exclude first!
        //   return !str.includes("-") // && and not webkit/or first or two in row


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
        // better to parse ident in kf? instead of to|from?
        // custom ident
        // if parent = "Value"?

        // if keyframe get naem and check in map. if statement && animation get name and check in map? extract animation immedialty
        // dont need to check if has mangled before?

        // if any of the word in animation is in keyframes names array. includes. then thats the value to mangle.
        // this way we dont need to care for order to find. can still be a problem? concering name that is.
        // we dont rely on the identification of ani names by identying pos/legal name or not - if pos its best?
        // pos = no conflict? what i dont exists?
        // if use kf names, and kf name is infinite we might identiify wrong. only pos/order can solve that? isolated algo to change?





        // figure out a way to use order. then we dont rely on identication by kf name, since user can have used a kf name that matches other
        // ident values in the animation prop value list. only those ident names legal in animation values list are relevant?

        // we dont need hasBeen mangled if use this algo? compare this and old method/same as other mangleName method
        // exit:
        //   mangle all in keyframs - both via ref, then add a map with old: new as we mangle
        //   then mangle all in animation props via - property.name = map[property.name]
        //
        // keyframe.forEach((item, i) => {
        //   name
        //
        //
        // });

        // the value itself, or its context and itself is what we need to figure out which to change
        // if change as go along we cant detect it? if use ani name and order we can?

        // instead of separating the identifier we want by type, aka custom idnet from tokenizer, we can find only the ones we want
        // from property name and value order/match - what if we use the inherit/infite as name of animation, does that work?
        // we cant use the same names of infinity as kf names? easy to test if bugs if i do i guess. reserved word?
        // can be infity becaes of order?
        // is it the only place kf name can be used/ref?
        enter(node, parent) {
          // if (config.mangleNames) // && parnet.type === "Value"?
          //   hasMangledNameBefore(node.type) // here we use it to determine if
            // Keyframes_  wont work!!
            // up there i can push, but here it its
            // Ident_aa - not if WE always have the name exisiting. which we dont if keyframes is first!
            // new fn to add keyframes, need diff map then? can have two?

            // iffy one, fn dec two, priv one, insie two
            // if mangle ident first, will be Ident_aa.. but! we dont know to mangle unless we ecnountered
            // kf first! since not added to map.

            // if we assume kf has been met, we can use this method because

            // mangle if exists, but picks new if dont. we dont know if we want to mangle - add && to check? can only inside?
            // if res come back as new name, has progressed thouhg..
            // make custom ident? in tokenize, check against list? or make it for names?
            // have own map for keyframe names?
            // return map?

            // and exists in map, mangle too

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
