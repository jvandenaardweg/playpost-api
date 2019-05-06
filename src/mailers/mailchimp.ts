require('dotenv').config();
import nodeFetch from 'node-fetch';
import md5 from 'md5';

const { MAILCHIMP_LIST_ID, MAILCHIMP_API_KEY } = process.env;

if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) throw new Error('Please set the MAILCHIMP_LIST_ID and MAILCHIMP_LIST_ID environment variable.');

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
  const payload = {
    email_address: emailAddress,
    status: 'subscribed'
  };

  const payloadStringified = JSON.stringify(payload);

  try {
    const response = await nodeFetch(MAILCHIMP_API_LIST_MEMBERS_URL, {
      headers,
      method: 'POST',
      body: payloadStringified
    })
    .then(response => response.json());

    console.log(`Mailchimp: Added ${emailAddress} to list "${MAILCHIMP_LIST_ID}".`);
    return response;
  } catch (err) {
    console.log(`Mailchimp: Error while adding e-mail address "${emailAddress}" to list ${MAILCHIMP_LIST_ID}.`);
    throw err;
  }
};

/**
 * Removes an e-mail address from a MailChimp list
 * The MailChimp API requires a subscriberHash. This is "the MD5 hash of the lowercase version of the list member’s email address.".
 * Reference: https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/#%20
 */
export const removeEmailToMailchimpList = async (emailAddress: string) => {
  const subscriberHash = md5(emailAddress.toLowerCase());

  try {
    const response = await nodeFetch(`${MAILCHIMP_API_LIST_MEMBERS_URL}/${subscriberHash}`, {
      headers,
      method: 'DELETE'
    });

    console.log(`Mailchimp: Deleted ${emailAddress} from list "${MAILCHIMP_LIST_ID}".`);
    return response;
  } catch (err) {
    console.log(`Mailchimp: Error while deleting e-mail address "${emailAddress}" from list ${MAILCHIMP_LIST_ID}.`);
    throw err;
  }
};
