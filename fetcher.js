const fetch = require('node-fetch');

const SYNTHESIZE_COST_PER_LETTER = 16 / 1000000 // 16 dollar per 1 million letters. First 1 million is free.
// TODO: Amazon is way cheaper: https://aws.amazon.com/polly/pricing/
// https://medium.com/@housemd/google-wavenet-vs-amazon-polly-eace00c16035

const getMediumPostIdFromUrl = (url) => {
    // Possibilities:
     // https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb
    // https://medium.com/p/13eda868daeb

    if (url.includes('https://medium.com/p/')) {
        return url.split('https://medium.com/p/')[1];
    } else {
        const urlItems = url.split('-');
        return urlItems[urlItems.length - 1]
    }

}

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

            const paragraphs = json.value.content.bodyModel.paragraphs
                .filter((paragraph) => {
                    return [1, 3, 7, 9, 13].includes(paragraph.type) && paragraph.text
                    // 3, 13 = headings
                    // 1, 3, 7, 9 = paragraph
                })

            const ssmlParagraphs = paragraphs
                .map((paragraph) => {
                    const hasTrailingPeriod = paragraph.text.endsWith('.')
                    const isHeading = [3, 13].includes(paragraph.type)

                    // Make sure each paragraph ends with a dot
                    // So the text to speech service pauses correctly
                    if (!hasTrailingPeriod && !isHeading) {
                        return `<p>${paragraph.text + '.'}</p>`
                    }

                    // Give emphasis to headings
                    if (isHeading) {
                        return `<emphasis level="moderate">${paragraph.text}</emphasis><break time="250ms" />`
                    }

                    return `<p>${paragraph.text}</p>`
                })


            const ssml = `<speak>${ssmlParagraphs.join('')}</speak>`

            const contentLength = paragraphs.join('').length

            const authorName = (firstAuthor.name) ? firstAuthor.name : null
            const authorUrl = (firstAuthor.username) ? `https://medium.com/@${firstAuthor.username}` : null  // TODO: is this always valid?
            const publicationName = (firstCollection.name) ? firstCollection.name : null  // TODO: is this always valid?
            const publicationUrl = (firstCollection.domain) ? `https://${firstCollection.domain}` : null  // TODO: is this always valid?

            const synthesizeSpeechCostInUSD = Number((contentLength * SYNTHESIZE_COST_PER_LETTER).toFixed(2))

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
                ssml,
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