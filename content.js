const fetch = require('node-fetch');

(async () => {
    try {
        const json = await getMediumPost(`https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb`)
        // const json = await getMediumPost(`https://medium.com/curated-by-versett/dont-eject-your-create-react-app-b123c5247741`)
        console.log(json)
    } catch (err) {
        console.log(err)
    }
})()

function getMediumPostById(mediumPostId) {
    return getMediumPost(`https://medium.com/p/${mediumPostId}`);
}

function getMediumPost(url) {
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

            return {
                mediumId,
                title,
                subtitle,
                url,
                previewImageId,
                previewImageUrl,
                readingTime,
                wordCount: json.value.virtuals.wordCount,
                detectedLanguage: json.value.detectedLanguage,
                detectedLanguage: json.value.detectedLanguage,
                author: firstAuthor.name,
                authorUrl: `https://medium.com/@${firstAuthor.username}`,
                publication: firstCollection.name,
                publicationUrl: `https://${firstCollection.domain}` // TODO: is this always valid?
            }
        })
}

process.on('unhandledRejection', (err) => { 
    console.error(err)
    process.exit(1)
})