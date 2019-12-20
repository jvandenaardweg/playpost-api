import joi from '@hapi/joi';
import { Request, Response } from 'express';

import { ArticleService } from '../../services/articleService';
import { BaseController } from '../index';

export class OembedController extends BaseController {
  articleService: ArticleService;

  constructor() {
    super()

    this.articleService = new ArticleService()
  }

  getAll = async (req: Request, res: Response) => {
    const playerBaseUrl = 'https://player.playpost.app';
    const oembedThumbnailUrl = playerBaseUrl + '/oembed.png';

    // Example url: https://player.playpost.app/articles/c3baaf54-28a5-47d1-b752-07f21bd8a7bc/audiofiles/72dc6da2-798a-4b14-a5e2-c0fbf4039788
    const { url, format } = req.query;

    try {
      if (format && format !== 'json') {
        throw {
          status: 400,
          message: 'We currently only support the json format. Please only use ?format=json'
        }
      }

      // Make sure we pass through the extra query parameters
      const fullQueryUrl = Object.keys(req.query).map(key => key + '=' + req.query[key]).join('&').replace('url=', '');
      const urlWithoutQueryParams = url.split('?')[0];

      const validationSchema = joi.object().keys({
        url: joi.string().uri().required()
      });

      const validateUrl = validationSchema.validate({ url });

      if (validateUrl.error) {
        throw {
          status: 400,
          message: validateUrl.error.details[0].message
        }
      }

      if (!url.startsWith(playerBaseUrl)) {
        throw {
          status: 400,
          message: `We only allow urls from ${playerBaseUrl}`
        }
      }

      const articleAndAudiofileIds: string[] = urlWithoutQueryParams.split('/').filter((urlPart: string) => {
        return !['https:', 'http:', '', 'player.playpost.app', 'localhost', 'localhost:8080', 'v1', 'articles', 'audiofiles'].includes(urlPart)
      })

      const articleId = articleAndAudiofileIds[0];
      const audiofileId = articleAndAudiofileIds[1];

      const otherValidationSchema = joi.object().keys({
        articleId: joi.string().uuid().required(),
        audiofileId: joi.string().uuid().required()
      });

      // tslint:disable-next-line: no-shadowed-variable
      const validateIds = otherValidationSchema.validate({ articleId, audiofileId });

      if (validateIds.error) {
        const messageDetails = validateIds.error.details.map(detail => detail.message).join(' and ');

        throw {
          status: 400,
          message: messageDetails
        }
      }

      // TODO: add caching
      const foundArticle = await this.articleService.findOne(articleId);

      if (!foundArticle) {
        throw {
          status: 404,
          message: `Could not find article with ID: ${articleId}`
        }
      }

      const foundAudiofile = foundArticle.audiofiles.find(audiofile => audiofile.id === audiofileId);

      if (!foundAudiofile) {
        throw {
          status: 404,
          message: `Could not find audiofile with ID: ${audiofileId}`
        }
      }

      const responseToSend = {
        version: '1.0',
        type: 'rich',
        provider_name: 'Playpost',
        provider_url: 'https://playpost.app',
        width: 480,
        height: 115, // Height in frontend/Player/index.scss
        title: foundArticle.title,
        author_name: foundArticle.sourceName,
        author_url: 'https://playpost.app', // Do not use article's source, medium will show the article as an embed then
        thumbnail_url: oembedThumbnailUrl,
        thumbnail_height: 115, // Heigth of player
        html: `<iframe src="${fullQueryUrl}" width="100%" height="115" frameborder="0" scrolling="no"></iframe>`
      }

      return res.json(responseToSend);

    } catch (err) {
      return this.handleError(err, res);
    }
  }
}
