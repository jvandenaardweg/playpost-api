import { Request, Response } from 'express'
import joi from 'joi'
import { getRepository, Repository } from 'typeorm'
import { Article } from '../database/entities/article'
import { oembedInputValidationSchema } from '../database/validators'

export class OembedController {
  articleRepository: Repository<Article>

  constructor() {
    this.articleRepository = getRepository(Article)
  }

  getOembedCode = async (req: Request, res: Response) => {
    // Example url: https://player.playpost.app/articles/c3baaf54-28a5-47d1-b752-07f21bd8a7bc/audiofiles/72dc6da2-798a-4b14-a5e2-c0fbf4039788
    const { url, format } = req.query;

    if (format && format !== 'json') {
      return res.status(400).json({
        message: 'We currently only support the json format. Please only use ?format=json'
      })
    }

    const { error } = joi.validate({ url }, oembedInputValidationSchema.requiredKeys('url'));

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!url.startsWith('https://player.playpost.app')) {
      return res.status(400).json({
        message: 'We only allow urls from https://player.playpost.app'
      })
    }

    try {
      const articleAndAudiofileIds: string[] = url.split('/').filter((urlPart: string) => {
        return !['https:', 'http:', '', 'player.playpost.app', 'localhost', 'localhost:8080', 'articles', 'audiofiles'].includes(urlPart)
      })

      const articleId = articleAndAudiofileIds[0];
      const audiofileId = articleAndAudiofileIds[1];

      // tslint:disable-next-line: no-shadowed-variable
      const { error } = joi.validate({
        articleId,
        audiofileId
      }, oembedInputValidationSchema.requiredKeys('articleId', 'audiofileId'));

      if (error) {
        const messageDetails = error.details.map(detail => detail.message).join(' and ');
        return res.status(400).json({ message: messageDetails });
      }

      const foundArticle = await this.articleRepository.findOne(articleId, { relations: ['audiofiles'] });

      if (!foundArticle) {
        return res.status(404).json({
          message: `Could not find article with ID: ${articleId}`
        })
      }

      const foundAudiofile = foundArticle.audiofiles.find(audiofile => audiofile.id === audiofileId);

      if (!foundAudiofile) {
        return res.status(404).json({
          message: `Could not find audiofile with ID: ${audiofileId}`
        })
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
        author_url: foundArticle.canonicalUrl || foundArticle.url,
        thumbnail_url: foundArticle.imageUrl,
        html: `<iframe src="https://player.playpost.app/articles/${foundArticle.id}/audiofiles/${foundAudiofile.id}" width="100%" height="110" frameborder="0" scrolling="no"></iframe>`
      }

      return res.json(responseToSend);
    } catch (err) {
      return res.status(500).json({
        message: err && err.message
      })
    }
  }

}
