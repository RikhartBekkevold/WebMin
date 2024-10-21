const { isEmpty, isCustomProperty } = require('./preds.js')

module.exports = {
  NamespaceRule: {
    enter(node) {
      if (this.config.mangleNamespaceNames && isEmpty(this.config.preMangledNames.namespaces)) {
        if (node.prefix && !this.mangledNamespaceMap[node.prefix.name])
          this.mangledNamespaceMap[node.prefix.name] = this.getUniqueNamespaceName()
      }
    }
  },

  PropertyRule: {
    enter(node, parent, index, visit, siblings) {
      this.varManager.addPropertyRule(node, siblings, index, this.config.resolveVariables)
    }
  },

  KeyframesRule: {
    enter(node, parent, index) {
      if (this.config.mangleKeyframeNames && isEmpty(this.config.preMangledNames.namespaces)) {
        // if name already exists, means we met keyframe with same org name before. use this name for second keyframe. dont update map.
        if (this.mangledKeyframesMap[node.name.name])
          node.name.name = this.mangledKeyframesMap[node.name.name]
        else {
          // if havent met keyframe before. create new name for it.
          var newName = this.getUniqueKeyframeName()
          this.mangledKeyframesMap[node.name.name] = newName
          node.name.name = newName
        }
      }
    }
  },

  Declaration: {
    enter(node, parent, index, visit, siblings) {
      // only add if we dont use prefilled usermap and mangle is defined
      if (
        isCustomProperty(node) &&
        this.config.mangleVariables &&
        !this.config.resolveVariables &&
        isEmpty(this.config.preMangledNames.variables)
      ) {
        if (!this.mangledCustomProps[node.property])
          this.mangledCustomProps[node.property] = "--" + this.getUniqueVariableName()

        return
      }

      if (isCustomProperty(node) && this.config.resolveVariables) {
        this.varManager.addNormalDeclaration(node, siblings, index)
      }
    }
  }
}
