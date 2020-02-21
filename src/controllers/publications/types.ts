import { Response } from 'express';
import { Publication } from '../../database/entities/publication';
import { Article } from '../../database/entities/article';

export interface PublicationResponse extends Response {
  locals: {
    publication: Publication;
  }
}

export interface AudioPreview {
  audio: string;
}

export interface PostImportArticleRequestBody {
  url: string;
}

export interface PostOnePreviewArticleSSMLRequestBody {
  ssml: string;
  voiceId: string;
}

export interface PatchOnePublicationArticleRequestBody {
  status?: Article['status'];
  ssml?: Article['ssml'];
  title?: Article['title'];
  url?: Article['url'];
  description?: Article['description'];
  sourceName?: Article['sourceName'];
  authorName?: Article['authorName'];
}
