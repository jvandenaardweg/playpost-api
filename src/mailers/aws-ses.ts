import * as Sentry from '@sentry/node';
import AWS from 'aws-sdk';

import { logger } from '../utils';

AWS.config.update({ region: process.env.AWS_REGION });

const client = new AWS.SES({ apiVersion: '2010-12-01' });

export const sendTransactionalEmail = async (toEmail: string, title: string, htmlBody: string) => {
  const loggerPrefix = 'AWS SES Send Mail:';

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
  const params = {
    Destination: {
      ToAddresses: [toEmail]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            ${htmlBody}
            ${transactionEmailFooter()}
          `
        },
        Text: {
          Charset: 'UTF-8',
          Data: ''
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: title
      }
    },
    Source: 'noreply@playpost.app',
    ReplyToAddresses: ['support@playpost.app']
  };

  try {
    // Create the promise and SES service object
    const sendMail = client.sendEmail(params);

    const result = await sendMail.promise();

    return result;
  } catch (err) {
    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('toEmail', toEmail);
      scope.setExtra('title', title);
      scope.setExtra('htmlBody', htmlBody);
      Sentry.captureException(err);
    });

    logger.error(loggerPrefix, 'Error happened.');
    logger.error(err);

    throw err; // pass it up
  }
};

export const transactionEmailFooter = () => {
  return `
    <p>If you have a question, feedback or need any help, just reply to this email and we'll help you out.</p>
    <p>
      Thanks,<br />
      Jordy van den Aardweg<br />
      Founder Playpost<br />
      support@playpost.app
    </p>
  `
}
