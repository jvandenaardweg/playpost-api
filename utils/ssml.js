const pollySSMLSplit = require('polly-ssml-split')

// Configuration example with default values
const options = {
    // MIN length of a single batch of split text
    softLimit: 4000,
    // MAX length of a single batch of split text
    hardLimit: 5000,
    // Set of extra split characters (Optional property)
    // extraSplitChars: ',;',
}

// Apply configuration
pollySSMLSplit.configure(options)

const getSSMLParts = (ssml) => {
    return new Promise((resolve, reject) => {
        console.log(`Splitting SSML content into different parts...`);

        const ssmlParts = pollySSMLSplit.split(ssml);

        if (ssmlParts && ssmlParts.length) {
            console.log(`Got ${ssmlParts.length} SSML parts.`);
            resolve(ssmlParts);
        } else {
            console.log('Got NO SSML parts. Error?');
            reject(ssmlParts);
        }
    })
}

module.exports = { getSSMLParts }