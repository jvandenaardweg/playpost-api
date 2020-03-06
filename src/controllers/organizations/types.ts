import { Response } from 'express';
import { Organization } from '../../database/entities/organization';

export interface OrganizationResponse extends Response {
  locals: {
    organization: Organization;
    isAdmin: boolean;
    isUser: boolean;
  }
}
export interface PostOneOrganizationRequestBody {
  name: string;
  countryId: string;
}
