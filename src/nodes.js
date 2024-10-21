function createQuotelessUrlNode(val, name) {
  return {
    type: "QuotelessUrl",
    val: val,
    name: name
  }
}

function createStringNode(val, delimiter) {
  return {
    type: "String",
    val: val,
    delimiter: delimiter
  }
}

function createDimensionNode(val, unit, isInt, isEpsilon) {
  return {
    type: "Dimension",
    val,
    unit, // px, em, rem
    isInt: isInt || false,
    isEpsilon: !!isEpsilon
  }
}

function createNumberNode(val, isInt, isEpsilon) {
  return {
    type: "Number",
    val,
    isInt: isInt || false,
    isEpsilon: !!isEpsilon
  }
}

function createHexNode(val) {
  return {
    type: "Hex",
    val: val
  }
}

function createStatementNode(name) {
  return {
    type: "Statement",
    important: false,
    property: name,
    value: {
      type: "Value",
      parts: []
    }
  }
}

function createIdentifierNode(name, locObj) { 
  var node = {
    type: "Identifier",
    name: name
  }
  if (locObj) node.loc = locObj
  return node
}

module.exports = {
  createDimensionNode,
  createHexNode,
  createStatementNode,
  createNumberNode,
  createIdentifierNode,
  createStringNode,
  createQuotelessUrlNode
}
