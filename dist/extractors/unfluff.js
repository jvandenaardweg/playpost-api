"use strict";
const unfluff = require('unfluff');
const htmlToText = (html) => {
    return unfluff(html);
};
module.exports = { htmlToText };
//# sourceMappingURL=unfluff.js.map