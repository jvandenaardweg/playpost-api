const fetcher = require('./fetcher');
const synthesize = require('./synthesize');

(async () => {
    try {
        // TODO: detecht if medium post is already in db
        // if not, get medium post
        // if so, see if we already have the audio file
        // const json = await fetcher.getMediumPost(`https://medium.com/curated-by-versett/dont-eject-your-create-react-app-b123c5247741`)
        const json = await fetcher.getMediumPost(`https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb`)

        if (json.content.length > 5000) {
            // TODO: chop at whole words
            const choppedContent = json.content.slice(0, 5000)
            const part = 1
            const fileName = await synthesize.toSpeech(json.mediumId, choppedContent, part);
            console.log(fileName)
        }
        // const json = await fetcher.getMediumPost(`https://hackernoon.com/ive-come-from-the-future-to-save-spotify-f69bea631ee4`)
        // console.log(json.mediumId, json.content)
        // synthesize.toSpeech(json.mediumId, json.content)
        // .then((fileName) => console.log(fileName));
        // const json = await getMediumPost(`https://medium.com/curated-by-versett/dont-eject-your-create-react-app-b123c5247741`)
        // console.log(json)
    } catch (err) {
        console.log(err)
    }
})();

process.on('unhandledRejection', (err) => {
    console.error(err)
    process.exit(1)
})