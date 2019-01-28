const fetch = require('node-fetch');

const SYNTHESIZE_COST_PER_LETTER = 16 / 1000000 // 16 dollar per 1 million letters. First 1 million is free.
// TODO: Amazon is way cheaper: https://aws.amazon.com/polly/pricing/
// https://medium.com/@housemd/google-wavenet-vs-amazon-polly-eace00c16035


const getMediumPostById = (mediumPostId) => {
    return getMediumPost(`https://medium.com/p/${mediumPostId}`);
}

const getMediumPost = (url) => {
    return fetch(url + '?format=json')
        .then((response) => response.text())
        .then((text) => JSON.parse(text.split('</x>')[1]).payload)
        .then((json) => {
            const firstAuthor = Object.values(json.references.User)[0]
            const firstCollection = Object.values(json.references.Collection)[0]

            const mediumId = json.value.id
            const title = json.value.title
            const url = json.value.canonicalUrl
            const subtitle = json.value.content.subtitle
            const previewImageId = json.value.virtuals.previewImage.imageId
            const previewImageUrl = (previewImageId) ? `https://cdn-images-1.medium.com/fit/c/160/160/${previewImageId}` : null
            const readingTime = (json.value.virtuals.readingTime) ? json.value.virtuals.readingTime : null
            const wordCount = (json.value.virtuals.wordCount) ? json.value.virtuals.wordCount : null
            const detectedLanguage = (json.value.detectedLanguage) ? json.value.detectedLanguage : null

            const contentParagraphs = (json.value.content.bodyModel.paragraphs.filter((paragraph, index) => [1, 3, 9].includes(paragraph.type) && paragraph.text))
            // paragraphy.type 1, 3, 9 seems normal text
            // TODO: make sure there's a period after each paragraph

            const content = contentParagraphs.map((paragraph) => paragraph.text).join(' ')
            const contentLength = content.length

            const authorName = (firstAuthor.name) ? firstAuthor.name : null
            const authorUrl = (firstAuthor.username) ? `https://medium.com/@${firstAuthor.username}` : null  // TODO: is this always valid?
            const publicationName = (firstCollection.name) ? firstCollection.name : null  // TODO: is this always valid?
            const publicationUrl = (firstCollection.domain) ? `https://${firstCollection.domain}` : null  // TODO: is this always valid?

            const synthesizeSpeechCostInUSD = Number((content.length * SYNTHESIZE_COST_PER_LETTER).toFixed(2))

            return {
                mediumId,
                title,
                subtitle,
                url,
                previewImageId,
                previewImageUrl,
                readingTime,
                wordCount,
                detectedLanguage,
                authorName,
                authorUrl,
                publicationName,
                publicationUrl,
                content,
                contentLength,
                synthesizeSpeechCostInUSD
            }
        })
}

process.on('unhandledRejection', (err) => { 
    console.error(err)
    process.exit(1)
})

module.exports = { getMediumPost, getMediumPostById }