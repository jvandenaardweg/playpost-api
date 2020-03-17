import { Response, Request } from 'express';
import { Publication } from '../../database/entities/publication';
import { Article } from '../../database/entities/article';
import { CollectionRequestQuery } from '../../typings';

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
  voice: {
    id: string;
  };
  article?: {
    id: string; // Not required, as the user can create a new article without the article already in our database
  }
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

// tslint:disable-next-line: no-empty-interface
export interface PostOnePublicationArticleRequestBody extends Article { }

export interface GetAllPublicationArticlesRequest extends Request {
  params: {
    publicationId: string;
  };
  query: CollectionRequestQuery
}

export interface GetOnePublicationRequest extends Request {
  params: {
    publicationId: string;
  };
}

// tslint:disable-next-line: no-empty-interface
export interface GetAllPublicationsRequest extends Request { }

export interface DeleteOnePublicationArticleRequest extends Request {
  params: {
    publicationId: string;
    articleId: string;
  }
}

export interface PostOnePublicationAudiofileRequest extends Request {
  params: {
    publicationId: string;
    articleId: string;
  }
}

export interface PostOnePublicationAudiofileRequestBody {
  voiceId: string;
  organizationId: string;
}

export interface PostOnePublicationPreviewSSMLRequest extends Request {
  params: {
    publicationId: string;
    articleId: string;
  };
  body: PostOnePreviewArticleSSMLRequestBody;
}

export interface PatchOnePublicationArticleRequest extends Request {
  params: {
    publicationId: string;
    articleId: string;
  };
  body: PatchOnePublicationArticleRequestBody;
}

export interface PostOnePublicationArticleRequest extends Request {
  params: {
    publicationId: string;
  };
  body: PostOnePublicationArticleRequestBody;
}

export interface GetOnePublicationArticleRequest extends Request {
  params: {
    publicationId: string;
    articleId: string;
  };
}

export interface PostOnePublicationImportArticleRequest extends Request {
  params: {
    publicationId: string;
    articleId: string;
  };
  body: PostImportArticleRequestBody
}
