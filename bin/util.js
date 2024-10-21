const { writeFileSync, readFileSync, readdirSync } = require('fs')

function readFile(arg) {
  try {
    var str = readFileSync(arg, "utf8")
    return str
  } catch (e) {
    console.log("Couldn't read " + arg + ". Ignored it.")
    return ""
  }
}

module.exports = {
  getCmdArgs(args) {
    args.shift()
    args.shift()
    return args
  },


  getOutputDir(args) {
    for (var i = 0; i < args.length; i++) {
      if (args[i] === "-o")
        return args[++i]
    }
    return "./min.css"
  },


  getInputFiles(args) {
    const minArgs = ["-o", "-i", "-c", "-m", "-mangle"]
    var concatedString = ""

    var idx = args.indexOf("-i")
    if (idx !== -1)
      args = args.slice(++idx)

    console.log(args);

    for (var arg of args) {
      if (minArgs.includes(arg))
        return concatedString
      var str = readFile(arg)
      concatedString += str
    }

    return concatedString
  },


  // Gets user config obj in this prio order:
  // 1. From -c arg path (allows any filename)
  // 2. From cwd path (assuming name webmin.config.js)
  // 3. Keep default
  // Support cmd config arguments later if deemed practical.
  getConfigObject(args) {
    for (var i = 0; i < args.length; i++)
      if (args[i] === "-c")
        return JSON.parse(readFile(args[++i]))

    var files = readdirSync(process.cwd())
    var hasConfigFile = files.includes("webmin.config.js")

    if (hasConfigFile)
      return JSON.parse(readFile("webmin.config.js"))
    else
      return null
  }
}
