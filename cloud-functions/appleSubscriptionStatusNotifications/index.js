const { PubSub } = require('@google-cloud/pubsub');

const pubsub = new PubSub();

/**
 * Method to receive update notifications (JSON object posts) for key subscription events.
 * This is applicable only for apps containing auto-renewable subscriptions.
 * It is recommended to use these notifications in conjunction with Receipt Validation to
 * validate users' current subscription status and provide them with service.
 *
 * https://help.apple.com/app-store-connect/#/dev0067a330b
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

function getPubSubMessages(subscriptionName) {
  const subscription = pubsub.subscription(subscriptionName);

  const messages = [];

  const messageHandler = (message) => {
    messages.push({
      pubSub: {
        messageId: message.id,
        messageAttributes: message.attributes,
      },
      notification: JSON.parse(message.data)
    });

    // "Ack" (acknowledge receipt of) the message
    // Send "Ack" when we have successfully processed the notification in our database
    // message.ack();
  };

  subscription.on('message', messageHandler);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      subscription.removeListener('message', messageHandler);
      resolve(messages);
    }, 5000);
  });
}

exports.processNotification = async (req, res) => {
  const notification = req.body;

  const pubSubTopics = {
    production: 'projects/playpost/topics/production_apple-subscription-notifications',
    staging: 'projects/playpost/topics/staging_apple-subscription-notifications',
    development: 'projects/playpost/topics/development_apple-subscription-notifications'
  };

  const pubSubSubscriptions = {
    production: 'projects/playpost/subscriptions/production_apple-subscription-notifications',
    staging: 'projects/playpost/subscriptions/staging_apple-subscription-notifications',
    development: 'projects/playpost/subscriptions/development_apple-subscription-notifications'
  };

  if (req.method === 'POST') {
    if (!notification) {
      return res.status(400).json({ message: 'No request body.' });
    }

    try {
      if (!notification.environment) throw new Error('Environment property not found in response');

      // Create a buffer we need to publish in PubSub
      const buffer = Buffer.from(JSON.stringify(notification));

      // When we receive a Sandbox notification we publish it to our Development AND Staging environment
      // Because we do not know from which environment it originates
      if (notification.environment === 'Sandbox') {
        const [stagingMessageId, developmentMessageId] = await Promise.all([
          await pubsub.topic(pubSubTopics.staging).publish(buffer),
          await pubsub.topic(pubSubTopics.development).publish(buffer)
        ]);

        console.log(`Staging: Message ${stagingMessageId} published.`, notification);
        console.log(`Development: Message ${developmentMessageId} published.`, notification);

        return res.status(200).json({
          staging: {
            stagingMessageId,
            notification
          },
          development: {
            developmentMessageId,
            notification
          }
        });
      }

      // We publish it to Production
      const productionMessageId = await pubsub.topic(pubSubTopics.production).publish(buffer);

      return res.status(200).json({
        production: {
          productionMessageId,
          notification
        }
      });
    } catch (err) {
      return res.status(400).json({ err });
    }
  }

  const { environment } = req.query;

  if (!environment) return res.status(400).json({ message: 'Please add an environment query parameter.' });

  if (!pubSubSubscriptions[environment]) return res.status(400).json({ message: 'Environment could not be found.' });

  // If it's GET, return the notifications in the queue
  const messages = await getPubSubMessages(pubSubSubscriptions[environment]);
  return res.status(200).json(messages);
};
