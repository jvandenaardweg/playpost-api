const extractors = require('./extractors/readability');
const fetch = require('node-fetch');

exports.getArticle = (req, res) => {
    fetch(req.query.url)
    .then((response) => response.text())
    .then((html) => extractors.htmlToText(html))
    .then((text) => console.log(text))
}

