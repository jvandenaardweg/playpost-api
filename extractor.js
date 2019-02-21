const fetch = require('node-fetch');
const extractors = require('./extractors/readability');

fetch('https://medium.com/@Trott/using-worker-threads-in-node-js-80494136dbb6')
  .then(response => response.text())
  .then(html => extractors.htmlToText(html))
  .then(text => console.log(text));
