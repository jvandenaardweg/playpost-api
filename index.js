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

    if (!user) throw new Error('No user found.')

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) throw new Error('Password incorrect.')

    const deletedUser = await prisma.deleteUser({
      email
    })

    res.json({message: 'deleted!'})
  }))

app.route('/v1/auth')
  .post(asyncMiddleware(async (req, res, next) => {
    const { email, password } = req.body

    if (!email && !password) throw new Error('No e-mail and or password given.');

    // Find the user with the given e-mail
    const user = await prisma.user({
        email
    })

    if (!user) throw new Error('No user found or password is incorrect.')

    const isValidPassword = await bcrypt.compare(password, user.password)

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