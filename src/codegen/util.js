function isComment(str) {
  // return str.match(/^\/*.*\/$/)
  return str.slice(0, 2) === "/*" &&
         str.slice(str.length-2) === "*/"
}

module.exports = {
  empty(str) {
    return str.trim().length === 0
  },

  createComment(str) {
    return isComment(str) ? str : "/*" + str + "*/"
  },
}
