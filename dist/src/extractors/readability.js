"use strict";
const Readability = require('Readability');
const JSDOM = require('jsdom').JSDOM;
const htmlToText = (html) => {
    const document = new JSDOM(html);
    const article = new Readability(document.window.document).parse();
    return article;
};
module.exports = { htmlToText };
//# sourceMappingURL=readability.js.map