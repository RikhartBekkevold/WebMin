module.exports = {
  // full list of props for linter, to validate. just a map to link prop to shorthand (object val not string? to have extra info like pos?)
  // linter: CSS validator/error - practice good compiler error?

  // HAVE TO USE "" since dash props
  "background-color": "background",
  // "background-size": "background", // baclkground: inherit 20px - but bigger? and inherit overrides aswell if already a backriund prop
  // "background-position": "background",


  // bacgorund an animation is the best examples to use? we assume only they exists for now? 


  // margin
  // margin top - fits a positon
  // merge - what if the decl has diff values? like two margins/backgrund? cant just keep last?

  // backround: color a;
  // backround: color; // is a also overriden? test

  // border: 1px solid black; // remove a value if its default and npt need? removeUnecssValues (eg. ..)
  // border-top: 1px oslid black;

  // cant repalce name of

  // border 1px solid black
  // border-width: 1px;
  // border-style (required)
  // border-color

  // "border-width": "border" // we can do this replacement and not change value. since they are identical.
  // however, if we have a border property after, it MUST have width ofc, but it can have other values too, which we now override?
  // so check before we replace, if rest/peek all nodes property val? if broder exists and what the vals are?
  // border: 1px solid red; would override width. and border-width is redundant so we can remove it? its the same as two border?
  // add this logic to the fn that remvoes dupli decl.?
  // before wont override?

  // get border string, pass to fn that checks if ok/return vals/bool?
}
// RELATION SHIP BETWEEN PROPS? and between their values? shorthand vs specific, can repalce all with SHORTHNAD.

// mrgin top / dir a diff thing?

// OPTIMIZE:
// sync and test, or run in parraellet, pipeline slow?
// each stage? what can happens at same time?

// {
//   "background-color": "background",
//   "background-size": "background", 1,
//   "background-position": "background", 2
// }
// need to alter value too? we can assume the value for each prop


// each one correspnds to a certain position on the non dash shorthand version
// so only do it if first?
// juse assume that anything with - can be replaced with the before dash word?

// if (node.property === "background-color")
//   node.property = "background"


// map? "background": "background-color"
// node.property.slice(node.property.indexOf("-"))



// 1!!!!!!!!!
// always repalce background-color with backgrund? bgcoor only has color as value, so dont need to check value. assume correct format ofc.
// is it slower this prop? since browser parser cant assume? it assumes first? cant predict format in advance so slower?
// same problem with mergin selectors?
// if node.property === "background-color" node.propert == "background"
// use a map to replace all instead. then can have link inmap in external file, instead of here.
// so: not map of all prop, or make a pred, by map of all links ot replace. if (map[prop])/exists node.property === map[prop]
// dont give us boolean, but alwayts string. and if dont exists, its undefined/false.


// if (node.property === "margin" || node.property === "padding") {
//
// }

// need to update value to. so for now: only update the prop that is the first of the shorthand?
// export fn with huge switch alternative?
// is the hex changed after background-color? yes, value is next element. we upodated value only.


// margin: 0;
// margin-bottom: 20px;
// ->
// margin: 0 20px 0 0; // not safe? yea its safe.
//
// // but this isnt: since we cant assume the other values. use inherit? longer?
// margin-top:
// margin-bottom:
//
// margin-bottom: 20px;
// margin: 0;
// ->
// margin: 0 0 20px 0;
// // minfiier makes ppl bad coders?
//
