const fetcher = require('./fetcher');

(async () => {
    try {
        // TODO: detecht if medium post is already in db
        // if not, get medium post
        // if so, see if we already have the audio file
        const json = await fetcher.getMediumPost(`https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb`)
        // const json = await getMediumPost(`https://medium.com/curated-by-versett/dont-eject-your-create-react-app-b123c5247741`)
        console.log(json)
    } catch (err) {
        console.log(err)
    }
})();

process.on('unhandledRejection', (err) => { 
    console.error(err)
    process.exit(1)
})