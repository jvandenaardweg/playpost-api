import Mercury from '@postlight/mercury-parser';
// const JSSoup = require('jssoup').default;

// const url="https://hackernoon.com/15-html-element-methods-youve-potentially-never-heard-of-fc6863e41b2a";
// const url="https://www.nytimes.com/2019/02/05/magazine/denis-voronenkov-assassination-russia-ukraine.html";
// const url="https://www.nu.nl/dieren/5656238/mediterraanse-sprinkhaansoort-ontdekt-in-nederland.html";
// const url="https://edition.cnn.com/2019/02/06/politics/donald-trump-state-of-the-union-address/index.html";
// const url="https://thenextweb.com/hardfork/2019/02/06/this-startup-is-putting-degrees-on-the-blockchain-to-beat-fake-diplomas/";
// Mercury.parse(url).then(result => {
//     var soup = new JSSoup(result.content)
//     var newSoup = removeAllAttributes(soup)
//     newSoup = removeSpecificEnclosedTags(newSoup, ['header', 'figure', 'pre', 'h1'])
//     newSoup = removeAllEmptyTags(newSoup)
//     console.log(newSoup.toString())
// });

export function crawl(url: string) {
    return Mercury.parse(url)
}

// function removeAllAttributes(soup) {
//     soup.findAll().forEach((tag) => tag.attrs = {})
//     return soup
// }

// function removeAllEmptyTags(soup) {
//     soup.findAll().forEach((tag) => {
//         if (!tag.text.length) {
//             tag.extract()
//         }
//     })
//     return soup
// }

// function removeSpecificEnclosedTags(soup, removeTags) {
//     removeTags.forEach((removeTag) => {
//         soup.findAll(removeTag).forEach((tag) => {
//             tag.extract()
//         })
//     })
// 	return soup
// }
