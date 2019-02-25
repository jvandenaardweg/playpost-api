"use strict";
const fetch = require('node-fetch');
const extractors = require('../../src/extractors/readability');
exports.getArticle = (req, res) => {
    fetch(req.query.url)
        .then((response) => response.text())
        .then((html) => extractors.htmlToText(html))
        .then((text) => console.log(text));
};
//# sourceMappingURL=index.js.map