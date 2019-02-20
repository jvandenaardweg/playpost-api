const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'JustASimpleSecretForDevelopmentDoNotUseThisForProduction';

const path = require('path');
const express = require('express');
const app = express();
const { prisma } = require('./generated/prisma-client')
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

app.use(bodyParser.json());  // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

const { asyncMiddleware } = require('./utils/async-middleware');

global.appRoot = path.resolve(__dirname);

app.route('/v1/me')
  .get(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    const exampleUserId = 'cjscxpj8q004x07541doytko6';

    const fragment = `
      fragment GetUserWithoutPassword on User {
        id
        email
        createdAt
        updatedAt
        activatedAt
        authenticatedAt
      }
    `

    const user = await prisma.user({ id: exampleUserId }).$fragment(fragment)

    console.log(user)

    // throw new Error('You have no access to this page. You should login to view your data.')

    if (!user) return res.status(404).json({ status: 404, message: 'No user found. This could happen when your account is deleted.' })

    res.json({ ...user })
  }))
  .put(asyncMiddleware(async (req, res, next) => {
    const { email } = req.body

    if (!email) throw new Error('Email address not given.')

    // TODO: get auth user id
    const exampleUserId = 'cjscxpj8q004x07541doytko6';

    const fragment = `
      fragment PutUserWithoutPassword on User {
        id
        email
        updatedAt
      }
    `

    const updatedUser = await prisma
      .updateUser({
        data: {
          email
        },
        where: {
          id: exampleUserId
        }
      }).$fragment(fragment)

    if (!updatedUser) return res.json({ message: 'Nothing updated.' })

    res.json({ ...updatedUser })
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `delete myself` })
  }))

app.route('/v1/archives')
  .get(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `get the archive from user ID: X` })
  }))
  .post(asyncMiddleware(async (req, res, next) => {
    const { id } = req.body
    // TODO: get auth user id
    res.json({ message: `add article ${id} to archive for user ID: X` })
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `delete article from archive for user ID: X` })
  }))

app.route('/v1/playlists')
  .get(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `get the playlist from user ID: X` })
  }))
  .post(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    const { id } = req.body
    // First, check to see if we already have the article details
    // Else, crawl the article page and add it to the database
    res.json({ message: `add article id "${id}" to playlist for user ID: X` })
  }))
  .put(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    const { url } = req.body
    // First, check to see if we already have the article details
    // Else, crawl the article page and add it to the database
    res.json({ message: `update playlist, probably changing the order of articles for user ID: X` })
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `delete article from playlist for user ID: X` })
  }))

app.route('/v1/favorites')
  .get(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `get the favorites from user ID: X` })
  }))
  .post(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `add article to favorites for user ID: X` })
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    // TODO: get auth user id
    res.json({ message: `delete article from favorites for user ID: X` })
  }))

app.route('/v1/articles/:articleId/playlist')
  .post(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params
    // TODO: get auth user id
    res.json({ message: `add article ID: ${articleId} to playlist, for user: X` })
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params
    // TODO: get auth user id
    res.json({ message: `delete article ID ${articleId} from playlist, for user ID: X` })
  }))

app.route('/v1/articles/:articleId/archive')
  .post(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params
    // TODO: get auth user id
    res.json({ message: `archive article ID: ${articleId}, for user: X` })
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params
    // TODO: get auth user id
    res.json({ message: `delete article ID ${articleId} from archive, for user ID: X` })
  }))

app.route('/v1/articles/:articleId/favorite')
  .post(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params
    // TODO: get auth user id
    res.json({ message: `favorite article ID: ${articleId}, for user: X` })
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params
    // TODO: get auth user id
    res.json({ message: `delete article ID: ${articleId} from favorites, for user: X` })
  }))

app.route('/v1/articles/:articleId/audiofile')
  .get(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params

    const article = await prisma.article({ id: articleId })

    if (!article) return res.status(404).json({status: 404, message: `Could not get an audiofile, because article with ID ${articleId} is not found.`})

    // TODO: get auth user id
    res.json({ message: `get (default) audiofile for article ID: ${articleId}` })
  }))
  .post(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params
    const { options } = req.body

    const article = await prisma.article({ id: articleId })

    if (!article) return res.status(404).json({status: 404, message: `Could not create an audiofile, because article with ID ${articleId} is not found.`})

    // TODO: get auth user id
    res.json({ message: `create a new audiofile for article ID: ${articleId}, using options: ${options}` })
  }))

app.route('/v1/articles/:articleId')
  .get(asyncMiddleware(async (req, res, next) => {
    const { articleId } = req.params

    const article = await prisma.article({ id: articleId })

    if (!article) return res.status(404).json({status: 404, message: `Could not get the article, bacause article with ID ${articleId} is not found.`})

    // TODO: get auth user id

    // Get the FULL article content, generate an audiofile when it's the first request
    res.json({ ...article })
  }))

app.route('/v1/articles')
  .post(asyncMiddleware(async (req, res, next) => {
    const { url } = req.body

    if (!url) throw new Error('URL payload is required.')

    // TODO: Crawl the URL, and get these basic data:
    /*
      const title = null
      const description = null
      const language = null
      const sourceName = null
      const url = null
    */

    // TODO: get auth user id

    // Create an article with preview data: url, title, description, language and sourceName
    res.json({ message: `create an article using url: ${url}` })
  }))

app.route('/v1/users')
  .post(asyncMiddleware(async (req, res, next) => {
    const { email, password } = req.body

    if (!email && !password) throw new Error('No e-mail and or password given.')

    const user = await prisma.user({ email })

    if (user) throw new Error('E-mail address already exists')

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.createUser({
      email,
      password: hashedPassword
    })

    // Send a token within a successful signup, so we can log the user in right away
    const token = jwt.sign({ id: createdUser.id }, JWT_SECRET)

    res.json({ token });
  }))
  .delete(asyncMiddleware(async (req, res, next) => {
    const { email, password } = req.body

    const user = await prisma.user({ email })

    if (!user) return res.status(404).json({ status: 404, message: 'No user found' })

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) throw new Error('Password incorrect.')

    const deletedUser = await prisma.deleteUser({
      email
    })

    res.json({ message: `User with e-mail address "${email}" is deleted! This cannot be undone.` })
  }))

app.route('/v1/auth')
  .post(asyncMiddleware(async (req, res, next) => {
    const { email, password } = req.body

    if (!email && !password) throw new Error('No e-mail and or password given.');

    // Find the user with the given e-mail
    const user = await prisma.user({
        email
    })

    if (!user) return req.status(404).json({ status: 404, message: 'No user found or password is incorrect.' })

    const isValidPassword = await bcrypt.compare(password, user.password)

    // TODO: Log tries for security
    if (!isValidPassword) throw new Error('Password is incorrect.')

    const token = jwt.sign({ id: user.id }, JWT_SECRET)

    res.json({ token })
  }))


app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));




// // A `main` function so that we can use async/await
// async function main() {

//   // const deleteAllArticles = await prisma.deleteManyArticles()
//   // const createSource = await prisma.createSource({
//   //   name: 'Medium',
//   //   url: 'https://medium.com'
//   // })
//   // return

//   // TODO: URL could be different but point to same article, how do we handle that?
//   const article = await prisma
//     .article({
//       url: 'https://medium.com/darius-foroux/stick-with-your-first-impressions-and-youll-never-worry-again-93c9f55dd6ae',
//     })
//     .audiofiles();

//   console.log('article', article)

//   if (!article) {
//     console.log('get source > create audio file > create article with audiofile')

//     const source = await prisma.source({
//       name: 'Medium'
//     });

//     if (!source) {
//       return console.log('Source does not exist, create it first or error.')
//     }

//     // TODO: Create audiofile in google

//     const newArticle = await prisma.createArticle({
//       source: {
//         connect: {
//           id: source.id
//         }
//       },
//       audiofiles: {
//         create: {
//           url: 'https://storage.googleapis.com/synthesized-audio-files/medium.com/13eda868daeb.mp3', // URL from Google Text To Speech
//           length: 12.231, // Length of the audiofile
//           language: 'EN',
//           voice: 'en-US-Wavenet-D',
//           synthesizer: 'GOOGLE'
//         }
//       },
//       title: 'Stick With Your First Impressions—And You’ll Never Worry Again',
//       subtitle: 'I bet that you’re extrapolating your perceptions all the time. Let me give you a few examples and tell whether I’m wrong.',
//       description: null,
//       url: 'https://medium.com/darius-foroux/stick-with-your-first-impressions-and-youll-never-worry-again-93c9f55dd6ae',
//       imageUrl: null,
//       readingTime: 3.172012578616352,
//       language: 'EN',
//       authorName: 'Darius Foroux',
//       authorUrl: 'https://medium.com/@dariusforoux',
//       publicationName: 'The Blog Of Darius Foroux',
//       publicationUrl: 'https://medium.com/darius-foroux',
//       sourceArticleId: '93c9f55dd6ae',
//       html: '<article><p>asd asd asd asd</p></article>',
//       ssml: '<speak><p>asd asd asd asd</p></speak>'
//     });

//     return console.log(newArticle);
//   }

//   if (article && !article.audiofiles && !article.audiofiles.length) {
//     return console.log('only create the audiofile');
//   }

//   // If we already have the audio file, return it
//   if (article && article.audiofiles && article.audiofiles.length) {
//     return console.log(article.audio);
//   }

//   console.log(article)

//   // Read all users from the database and print them to the console
//   // const deleteAllArticles = await prisma.deleteManyArticles();
//   // const allSources = await prisma.sources()

//   // console.log(source);

//   // https://medium.com/darius-foroux/stick-with-your-first-impressions-and-youll-never-worry-again-93c9f55dd6ae


//   // console.log(newArticle)
// }

// main().catch(e => console.error('ERROR!', e.message))