const pollySSMLSplit = require('polly-ssml-split')

// Configuration example with default values
const options = {
    // MIN length of a single batch of split text
    softLimit: 2000,
    // MAX length of a single batch of split text
    hardLimit: 3000,
    // Set of extra split characters (Optional property)
    // extraSplitChars: ',;',
}

// Apply configuration
pollySSMLSplit.configure(options)

const splitSSML = (ssml) => {
    return new Promise((resolve, reject) => {
        const ssmlParts = pollySSMLSplit.split(ssml)
        if (ssmlParts && ssmlParts.length) {
            resolve(ssmlParts)
        } else {
            reject(ssmlParts)
        }
    })
}

module.exports = { splitSSML }