"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const body_parser_1 = __importDefault(require("body-parser"));
const node_1 = __importDefault(require("@sentry/node"));
const passport_1 = __importDefault(require("passport"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const audiofileController = __importStar(require("./controllers/audiofile"));
const meController = __importStar(require("./controllers/me"));
const archivesController = __importStar(require("./controllers/archives"));
const playlistsController = __importStar(require("./controllers/playlists"));
const favoritesController = __importStar(require("./controllers/favorites"));
const usersController = __importStar(require("./controllers/users"));
const authController = __importStar(require("./controllers/auth"));
const articlesController = __importStar(require("./controllers/articles"));
const PORT = process.env.PORT || 3000;
const IS_PROTECTED = passport_1.default.authenticate('jwt', { session: false, failWithError: true });
global.appRoot = path_1.default.resolve(__dirname);
const app = express_1.default();
app.use(helmet_1.default());
app.use(compression_1.default());
if (process.env.NODE_ENV === 'production') {
    node_1.default.init({
        dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178',
        environment: 'production'
    });
    // The request handler must be the first middleware on the app
    app.use(node_1.default.Handlers.requestHandler());
    app.use(node_1.default.Handlers.errorHandler());
}
// Use passport authentication
app.use(passport_1.default.initialize());
require('./config/passport')(passport_1.default);
// Make express allow JSON payload bodies
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// API Endpoints
app.get('/audiofile', audiofileController.getAudiofile); // Legacy, now in use by our iOS App
app.get('/v1/audiofile', audiofileController.getAudiofile); // Legacy, now in use by our iOS App
app.post('/v1/users', usersController.postUsers); // Creating of users is not protected by a login ofcourse
app.get('/v1/users/:userId', IS_PROTECTED, meController.getMe);
app.delete('/v1/users/:userId', IS_PROTECTED, usersController.deleteUsers);
// app.patch('/v1/users/:userId/email', IS_PROTECTED, usersController.deleteUsers);
// app.patch('/v1/users/:userId/password', IS_PROTECTED, usersController.deleteUsers);
// app.get('/v1/users/:userId/playlists', IS_PROTECTED, meController.getMe);
// app.get('/v1/users/:userId/favorites', IS_PROTECTED, meController.getMe);
// app.get('/v1/users/:userId/archives', IS_PROTECTED, meController.getMe);
app.get('/v1/me', IS_PROTECTED, meController.getMe);
app.get('/v1/me/favorites', IS_PROTECTED, meController.findAllFavoriteArticles);
app.post('/v1/me/favorites', IS_PROTECTED, meController.createFavoriteArticle);
app.get('/v1/me/articles', IS_PROTECTED, meController.findAllCreatedArticles);
// app.get('/v1/me/playlist', IS_PROTECTED, meController.findAllPlaylist);
// app.post('/v1/me/playlist', IS_PROTECTED, meController.createPlaylist);
// app.get('/v1/me/archive', IS_PROTECTED, meController.findAllArchive);
// app.get('/v1/me/favorites', IS_PROTECTED, meController.findAllFavorites);
// app.post('/v1/me/favorites', IS_PROTECTED, meController.createFavorite);
app.patch('/v1/me/email', IS_PROTECTED, meController.patchMeEmail);
app.patch('/v1/me/password', IS_PROTECTED, meController.patchMePassword);
app.delete('/v1/me', IS_PROTECTED, meController.deleteMe);
app.get('/v1/archives', IS_PROTECTED, archivesController.getArchives);
app.post('/v1/archives', IS_PROTECTED, archivesController.postArchives);
app.delete('/v1/archives', IS_PROTECTED, archivesController.deleteArchives);
app.get('/v1/playlists', IS_PROTECTED, playlistsController.getPlaylists);
app.post('/v1/playlists', IS_PROTECTED, playlistsController.postPlaylists);
app.put('/v1/playlists', IS_PROTECTED, playlistsController.putPlaylists);
app.delete('/v1/playlists', IS_PROTECTED, playlistsController.deletePlaylists);
app.get('/v1/favorites', IS_PROTECTED, favoritesController.getFavorites);
app.post('/v1/favorites', IS_PROTECTED, favoritesController.postFavorites);
app.delete('/v1/favorites', IS_PROTECTED, favoritesController.deleteFavorites);
app.post('/v1/auth', authController.postAuth);
app.post('/v1/articles', IS_PROTECTED, articlesController.postArticles);
app.get('/v1/articles/:articleId', IS_PROTECTED, articlesController.getArticlesById);
app.get('/v1/articles/:articleId/audiofiles', IS_PROTECTED, articlesController.getAudiofileByArticleId);
app.post('/v1/articles/:articleId/audiofiles', IS_PROTECTED, articlesController.postAudiofileByArticleId);
app.post('/v1/articles/:articleId/favorites', IS_PROTECTED, articlesController.postFavoriteByArticleId);
app.delete('/v1/articles/:articleId/favorites', IS_PROTECTED, articlesController.deleteFavoriteByArticleId);
app.post('/v1/articles/:articleId/archives', IS_PROTECTED, articlesController.postArchiveByArticleId);
app.delete('/v1/articles/:articleId/archives', IS_PROTECTED, articlesController.deleteArchiveByArticleId);
app.post('/v1/articles/:articleId/playlists', IS_PROTECTED, articlesController.postPlaylistByArticleId);
app.delete('/v1/articles/:articleId/playlists', IS_PROTECTED, articlesController.deletePlaylistByArticleId);
app.all('*', (req, res) => __awaiter(this, void 0, void 0, function* () { return res.status(404).json({ message: `No route found for ${req.method} ${req.url}` }); }));
// Handle error exceptions
app.use((err, req, res, next) => {
    /* eslint-disable no-console */
    if (err) {
        if (process.env.NODE_ENV === 'production') {
            // Grab the user so we can give some context to our errors
            if (req.user) {
                const { id, email } = req.user;
                node_1.default.configureScope((scope) => {
                    scope.setUser({ id, email });
                });
                console.log(`Error for user ID "${id}", email: "${email}"`);
            }
            // Capture the error for us to see in Sentry
            node_1.default.captureException(err);
        }
        console.log(`Error on route: ${req.method} ${req.url} "${err.message}"`);
        if (err.message === 'Unauthorized') {
            return res.status(401).json({
                message: 'Unauthorized. You don\'t have access to this endpoint. If you are not loggedin, try again by logging in.'
            });
        }
        // Return a general error to the user
        return res.status(500).json({
            message: 'An unexpected error occurred. Please try again or contact us when this happens again.'
        });
    }
    return next(err);
});
/* eslint-disable no-console */
app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
//# sourceMappingURL=index.js.map