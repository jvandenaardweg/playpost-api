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

export interface PostOneOrganizationPublicationRequestBody {
  name: string;
  url: string;
}

export interface PatchOneOrganizationCustomerRequestBody {
  email: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    state?: string;
    country: string;
  };
  taxId: {
    value: string;
  }
}

export interface PatchOneCustomerPaymentMethodRequestBody {
  billingDetailsName: string;
  cardExpireMonth: number;
  cardExpireYear: number;
}

export interface PostOneOrganizationSubscriptionRequestBody {
  stripePlanId: string;
  stripePaymentMethodId: string;
  stripeTaxRateId?: string;
  customTrialEndDate?: number | 'now';
}

export interface PostOneOrganizationCustomerPaymentMethodRequestBody {
  newStripePaymentMethodId: string;
}

export interface PatchOneOrganizationSubscriptionRequestBody {
  newStripePlanId: string;
}
