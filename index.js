const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');
const { prisma } = require('./generated/prisma-client');
const { crawl } = require('./extractors/mercury');
const { detectLanguage } = require('./utils/detect-language');
const { asyncMiddleware } = require('./utils/async-middleware');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'JustASimpleSecretForDevelopmentDoNotUseThisForProduction';

const app = express();

Sentry.init({
  dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178',
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

global.appRoot = path.resolve(__dirname);

app
  .route('/v1/me')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .get(asyncMiddleware(async (req, res) => {
    // TODO: get auth user id
    const exampleUserId = 'cjse81h67005t0754uiuiwb12';

    const fragment = `
      fragment GetUserWithoutPassword on User {
        id
        email
        createdAt
        updatedAt
        activatedAt
        authenticatedAt
      }
    `;

    const user = await prisma
      .user({
        id: exampleUserId,
      })
      .$fragment(fragment);

    // throw new Error('You have no access to this page. You should login to view your data.')

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'No user found. This could happen when your account is deleted.',
      });
    }

    return res.json({
      ...user,
    });
  }))
  .put(
    asyncMiddleware(async (req, res, next) => {
      const {
        email,
      } = req.body;

      if (!email) {
        return res.status(400).json({
          message: 'Email address not given.',
        });
      }

      // TODO: get auth user id
      const exampleUserId = 'cjse81h67005t0754uiuiwb12';

      const fragment = `
      fragment PutUserWithoutPassword on User {
        id
        email
        updatedAt
      }
    `;

      const updatedUser = await prisma
        .updateUser({
          data: {
            email,
          },
          where: {
            id: exampleUserId,
          },
        })
        .$fragment(fragment);

      if (!updatedUser) {
        return res.json({
          message: 'Nothing updated.',
        });
      }

      res.json({
        ...updatedUser,
      });
    }),
  )
  .delete(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'delete myself',
      });
    }),
  );

app
  .route('/v1/archives')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .get(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'get the archive from user ID: X',
      });
    }),
  )
  .post(
    asyncMiddleware(async (req, res, next) => {
      const {
        id,
      } = req.body;
      // TODO: get auth user id
      res.json({
        message: `add article ${id} to archive for user ID: X`,
      });
    }),
  )
  .delete(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'delete article from archive for user ID: X',
      });
    }),
  );

app
  .route('/v1/playlists')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .get(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'get the playlist from user ID: X',
      });
    }),
  )
  .post(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      const {
        articleId,
      } = req.body;

      const article = await prisma.article({
        id: articleId,
      });

      if (!article) {
        // Create article, then add to playlist
        return;
      }

      const addedToPlaylist = await prisma.createFavorite({});

      // First, check to see if we already have the article details
      // Else, crawl the article page and add it to the database
      res.json({
        message: `add article id "${articleId}" to playlist for user ID: X`,
      });
    }),
  )
  .put(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      const {
        url,
      } = req.body;
      // First, check to see if we already have the article details
      // Else, crawl the article page and add it to the database
      res.json({
        message: 'update playlist, probably changing the order of articles for user ID: X',
      });
    }),
  )
  .delete(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'delete article from playlist for user ID: X',
      });
    }),
  );

app
  .route('/v1/favorites')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .get(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'get the favorites from user ID: X',
      });
    }),
  )
  .post(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'add article to favorites for user ID: X',
      });
    }),
  )
  .delete(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      res.json({
        message: 'delete article from favorites for user ID: X',
      });
    }),
  );

app
  .route('/v1/articles/:articleId/playlist')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .post(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;
      // TODO: get auth user id
      res.json({
        message: `add article ID: ${articleId} to playlist, for user: X`,
      });
    }),
  )
  .delete(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;
      // TODO: get auth user id
      res.json({
        message: `delete article ID ${articleId} from playlist, for user ID: X`,
      });
    }),
  );

app
  .route('/v1/articles/:articleId/archive')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .post(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;
      // TODO: get auth user id
      res.json({
        message: `archive article ID: ${articleId}, for user: X`,
      });
    }),
  )
  .delete(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;
      // TODO: get auth user id
      res.json({
        message: `delete article ID ${articleId} from archive, for user ID: X`,
      });
    }),
  );

app
  .route('/v1/articles/:articleId/favorite')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .post(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;
      // TODO: get auth user id
      res.json({
        message: `favorite article ID: ${articleId}, for user: X`,
      });
    }),
  )
  .delete(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;
      // TODO: get auth user id
      res.json({
        message: `delete article ID: ${articleId} from favorites, for user: X`,
      });
    }),
  );

app
  .route('/v1/articles/:articleId/audiofile')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .get(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;

      const article = await prisma.article({
        id: articleId,
      });

      if (!article) {
        return res.status(404).json({
          status: 404,
          message: `Could not get an audiofile, because article with ID ${articleId} is not found.`,
        });
      }

      // TODO: get auth user id
      res.json({
        message: `get (default) audiofile for article ID: ${articleId}`,
      });
    }),
  )
  .post(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;
      const {
        options,
      } = req.body;

      const article = await prisma.article({
        id: articleId,
      });

      if (!article) {
        return res.status(404).json({
          status: 404,
          message: `Could not create an audiofile, because article with ID ${articleId} is not found.`,
        });
      }

      // TODO: get auth user id
      res.json({
        message: `create a new audiofile for article ID: ${articleId}, using options: ${options}`,
      });
    }),
  );

app
  .route('/v1/articles/:articleId')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .get(
    asyncMiddleware(async (req, res, next) => {
      const {
        articleId,
      } = req.params;

      const article = await prisma.article({
        id: articleId,
      });

      if (!article) {
        return res.status(404).json({
          status: 404,
          message: `Could not get the article, bacause article with ID ${articleId} is not found.`,
        });
      }

      // TODO: get auth user id

      // Get the FULL article content, generate an audiofile when it's the first request
      res.json({
        ...article,
      });
    }),
  );

app
  .route('/v1/articles')
  .all((req, res, next) => {
    // TODO : check if logged in
    next();
  })
  .post(
    asyncMiddleware(async (req, res, next) => {
      // TODO: get auth user id
      const exampleUserId = 'cjse81h67005t0754uiuiwb12';

      const {
        url,
      } = req.body;

      if (!url) {
        return res.status(400).json({
          message: 'URL payload is required.',
        });
      }

      const user = await prisma.user({
        id: exampleUserId,
      });

      if (!user) {
        return res.status(400).json({
          message: 'User not found. You are not logged in, or your account is deleted.',
        });
      }

      const article = await prisma.article({
        url,
      });

      if (article) {
        return res.status(400).json({
          message: 'Article already exists.',
          article,
        });
      }

      // if (article) {
      //   // Connect article to the playlist of the current user, so it becomes available in his playlist
      //   const updatedPlaylist = await prisma.updateArticle({
      //     data: {
      //       playlists: {
      //         create: {
      //           user,
      //           article
      //         }
      //       }
      //     },
      //     where: {
      //       id: article.id
      //     }
      //   })
      //   return res.json({ message: `Article already exists in database, we just add it to the users playlist.` })
      // }

      const {
        title,
        excerpt,
        author,
        domain,
      } = await crawl(url);

      const language = detectLanguage(excerpt);

      if (language !== 'eng') {
        return res.status(400).json({
          status: 400,
          message: `The language of the Article '${language}' is currently not supported. Please only add English articles.`,
        });
      }

      // TODO: Crawl the URL, and get these basic data:
      /*
      const title = null
      const description = null
      const language = null
      const sourceName = null
      const url = null
    */

      console.log('user', user);

      const createdArticle = await prisma.createArticle({
        title,
        description: excerpt,
        authorName: author,
        sourceName: domain,
        url,
        language: 'EN',
        user: {
          connect: {
            id: exampleUserId,
          },
        },
        playlists: {
          connect: {
            user: {
              id: exampleUserId,
            },
            order: 0,
          },
        },
      });

      // Create an article with preview data: url, title, description, language and sourceName
      res.json({
        ...createdArticle,
      });
    }),
  );

app.route('/v1/users')
  .post(asyncMiddleware(async (req, res) => {
    const { email, password } = req.body;

    if (!email && !password) return res.status(400).json({ message: 'No e-mail and or password given.' });

    const user = await prisma.user({ email });

    if (user) return res.status(400).json({ message: 'E-mail address already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.createUser({
      email,
      password: hashedPassword
    });

    // Send a token within a successful signup, so we can log the user in right away
    const token = jwt.sign({ id: createdUser.id }, JWT_SECRET);

    return res.json({ token });
  }))
  .delete(
    asyncMiddleware(async (req, res, next) => {
      const {
        email,
        password,
      } = req.body;

      const user = await prisma.user({
        email,
      });

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: 'No user found',
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) throw new Error('Password incorrect.');

      const deletedUser = await prisma.deleteUser({
        email,
      });

      return res.json({
        message: `User with e-mail address "${email}" is deleted! This cannot be undone.`,
      });
    }),
  );

app.route('/v1/auth')
  .post(asyncMiddleware(async (req, res) => {
    const { email, password } = req.body;

    if (!email && !password) return req.status(404).json({ status: 404, message: 'No e-mail and or password given. });

    // Find the user with the given e-mail
    const user = await prisma.user({ email });

    if (!user) return req.status(404).json({ status: 404, message: 'No user found or password is incorrect.' });

    const isValidPassword = await bcrypt.compare(password, user.password);

    // TODO: Log tries for security
    if (!isValidPassword) return new Error('Password is incorrect.');

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    return res.json({ token });
  }));

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
