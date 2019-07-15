require('dotenv').config();
import nodeFetch from 'node-fetch';
import md5 from 'md5';
import * as Sentry from '@sentry/node';

import { logger } from '../utils';

const MAILCHIMP_LIST_ID = '714d3d1c6d';
const MAILCHIMP_API_KEY = '2180a3003601f812d7f391a398891d32-us2';

const MAILCHIMP_SERVER_ID = MAILCHIMP_API_KEY.split('-')[1];
const MAILCHIMP_API_LIST_MEMBERS_URL = `https://${MAILCHIMP_SERVER_ID}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;

const headers = {
  Authorization: `apikey ${MAILCHIMP_API_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Adds an e-mail address to a a MailChimp list
 * The MailChimp API requires a list ID.
 * Reference: https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/#create-post_lists_list_id_members
 */
export const addEmailToMailchimpList = async (emailAddress: string) => {
  try {
    logger.info(`Mailchimp: Adding ${emailAddress} to list "${MAILCHIMP_LIST_ID}"...`);

    const payload = {
      email_address: emailAddress,
      status: 'subscribed'
    };

    const payloadStringified = JSON.stringify(payload);

    const response = await nodeFetch(MAILCHIMP_API_LIST_MEMBERS_URL, {
      headers,
      method: 'POST',
      body: payloadStringified
    }).then(response => response.json());

    logger.info(`Mailchimp: Successfully added ${emailAddress} to list "${MAILCHIMP_LIST_ID}".`);
    return response;
  } catch (err) {
    logger.error(`Mailchimp: Error while adding "${emailAddress}" to list ${MAILCHIMP_LIST_ID}.`);
    Sentry.captureException(err);
    throw err;
  }
};

/**
 * Removes an e-mail address from a MailChimp list
 * The MailChimp API requires a subscriberHash. This is "the MD5 hash of the lowercase version of the list member’s email address.".
 * Reference: https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/#%20
 */
export const removeEmailToMailchimpList = async (emailAddress: string) => {
  try {
    logger.info(`Mailchimp: Deleting ${emailAddress} from list "${MAILCHIMP_LIST_ID}"...`);

    const subscriberHash = md5(emailAddress.toLowerCase());

    const response = await nodeFetch(`${MAILCHIMP_API_LIST_MEMBERS_URL}/${subscriberHash}`, {
      headers,
      method: 'DELETE'
    });

    logger.info(`Mailchimp: Successfully deleted ${emailAddress} from list "${MAILCHIMP_LIST_ID}".`);
    return response;
  } catch (err) {
    logger.error(`Mailchimp: Error while deleting "${emailAddress}" from list ${MAILCHIMP_LIST_ID}.`);
    Sentry.captureException(err);
    throw err;
  }
};
