import { Response } from 'express';
import { Publication } from '../../database/entities/publication';

export interface PublicationResponse extends Response {
  locals: {
    publication: Publication;
  }
}
