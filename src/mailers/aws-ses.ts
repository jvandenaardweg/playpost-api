import AWS from 'aws-sdk';
import { logger } from '@sentry/utils';

AWS.config.update({ region: process.env.AWS_REGION });

export const sendTransactionalEmail = async (toEmail: string, title: string, htmlBody: string) => {
  const loggerPrefix = 'AWS SES Send Mail:';

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
  const params = {
    Destination: {
      ToAddresses: [
        toEmail,
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody
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
    ReplyToAddresses: [
      'info@playpost.app'
    ],
  };

  try {
    // Create the promise and SES service object
    const sendMail = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params);

    const result = await sendMail.promise();

    return result;
  } catch (err) {
    logger.error(loggerPrefix, 'Error happened.');
    logger.error(err);
    throw err; // pass it up
  }
}
