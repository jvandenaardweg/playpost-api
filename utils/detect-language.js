const franc = require('franc')

const detectLanguage = (text) => franc(text)

module.exports = { detectLanguage }