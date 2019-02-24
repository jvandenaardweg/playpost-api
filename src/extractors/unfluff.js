const unfluff = require('unfluff');

const htmlToText = (html) => {
    return unfluff(html)
}

module.exports = { htmlToText }