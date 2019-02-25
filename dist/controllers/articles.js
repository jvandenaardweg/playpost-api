"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_1 = require("../generated/prisma-client");
const mercury_1 = require("../extractors/mercury");
const detect_language_1 = require("../utils/detect-language");
const MESSAGE_ARTICLE_URL_REQUIRED = 'URL payload is required.';
const MESSAGE_ARTICLE_USER_NOT_FOUND = 'User not found. You are not logged in, or your account is deleted.';
const MESSAGE_ARTICLE_EXISTS = 'Article already exists.';
exports.postArticles = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const userId = req.user.id;
    const { url } = req.body;
    if (!url)
        return res.status(400).json({ message: MESSAGE_ARTICLE_URL_REQUIRED });
    const user = yield prisma_client_1.prisma.user({ id: userId });
    if (!user)
        return res.status(400).json({ message: MESSAGE_ARTICLE_USER_NOT_FOUND });
    const article = yield prisma_client_1.prisma.article({ url });
    if (article)
        return res.status(400).json({ message: MESSAGE_ARTICLE_EXISTS, article });
    const { title, excerpt, author, domain } = yield mercury_1.crawl(url);
    const language = detect_language_1.detectLanguage(excerpt);
    if (language !== 'eng') {
        return res.status(400).json({
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
    /* eslint-disable no-console */
    // console.log('user', user);
    const createdArticle = yield prisma_client_1.prisma.createArticle({
        title,
        description: excerpt,
        authorName: author,
        sourceName: domain,
        url,
        language: 'EN',
        user: {
            connect: {
                id: userId,
            },
        }
    });
    // Create an article with preview data: url, title, description, language and sourceName
    return res.json(Object.assign({}, createdArticle));
});
exports.getArticlesById = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId } = req.params;
    const article = yield prisma_client_1.prisma.article({ id: articleId });
    if (!article) {
        return res.status(404).json({
            message: `Could not get the article, bacause article with ID ${articleId} is not found.`,
        });
    }
    // TODO: get auth user id
    // Get the FULL article content, generate an audiofile when it's the first request
    return res.json(Object.assign({}, article));
});
exports.getAudiofileByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId } = req.params;
    const article = yield prisma_client_1.prisma.article({ id: articleId });
    if (!article) {
        return res.status(404).json({
            message: `Could not get an audiofile, because article with ID ${articleId} is not found.`,
        });
    }
    // TODO: get auth user id
    return res.json({ message: `get (default) audiofile for article ID: ${articleId}` });
});
exports.postAudiofileByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId, } = req.params;
    const { options, } = req.body;
    const article = yield prisma_client_1.prisma.article({
        id: articleId,
    });
    if (!article) {
        return res.status(404).json({
            message: `Could not create an audiofile, because article with ID ${articleId} is not found.`,
        });
    }
    // TODO: get auth user id
    return res.json({
        message: `create a new audiofile for article ID: ${articleId}, using options: ${options}`,
    });
});
exports.postFavoriteByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId, } = req.params;
    // TODO: get auth user id
    return res.json({
        message: `favorite article ID: ${articleId}, for user: X`,
    });
});
exports.deleteFavoriteByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId, } = req.params;
    // TODO: get auth user id
    return res.json({
        message: `delete article ID: ${articleId} from favorites, for user: X`,
    });
});
exports.postArchiveByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId, } = req.params;
    // TODO: get auth user id
    return res.json({
        message: `archive article ID: ${articleId}, for user: X`,
    });
});
exports.deleteArchiveByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId, } = req.params;
    // TODO: get auth user id
    return res.json({
        message: `delete article ID: ${articleId} from archive, for user: X`,
    });
});
exports.postPlaylistByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId, } = req.params;
    // TODO: get auth user id
    return res.json({
        message: `add article ID: ${articleId} to playlist, for user: X`,
    });
});
exports.deletePlaylistByArticleId = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { articleId, } = req.params;
    // TODO: get auth user id
    return res.json({
        message: `delete article ID: ${articleId} from playlist, for user: X`,
    });
});
//# sourceMappingURL=articles.js.map