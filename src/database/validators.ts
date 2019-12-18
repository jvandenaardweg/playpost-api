import joi from '@hapi/joi';

export const articleInputValidationSchema = joi.object().keys({
  articleUrl: joi.string().uri(),
  articleId: joi.string().uuid()
});

export const oembedInputValidationSchema = joi.object().keys({
  articleId: joi.string().uuid(),
  audiofileId: joi.string().uuid(),
  url: joi.string().uri()
});

export const audiofileInputValidationSchema = joi.object().keys({
  userId: joi.string().uuid(),
  playlistId: joi.string().uuid(),
  articleId: joi.string().uuid(),
  voiceId: joi.string().uuid(),
  name: joi.string(),
  url: joi.string().uri(),
  articleUrl: joi.string().uri(),
  audiofileId: joi.string().uuid(),
  mimeType: joi.string()
});

export const subscriptionPurchaseValidationSchema = joi.object().keys({
  receipt: joi.string(),
  productId: joi.string(),
  inAppSubscriptionId: joi.string().uuid(),
  platform: joi.string()
});

export const playlistInputValidationSchema = joi.object().keys({
  userId: joi.string().uuid(),
  playlistId: joi.string().uuid(),
  playlistItemId: joi.string().uuid(),
  articleId: joi.string().uuid(),
  name: joi.string(),
  order: joi
    .number()
    .integer()
    .min(0),
  articleUrl: joi.string().uri(),
  archivedAt: joi.alternatives().try(joi.string().allow(null)),
  favoritedAt: joi.alternatives().try(joi.string().allow(null)),
  documentHtml: joi.string()
});

export const userInputValidationSchema = joi.object().keys({
  id: joi.string().uuid(),
  userId: joi.string().uuid(),
  email: joi.string().email({ minDomainSegments: 2 }),
  password: joi.string().min(6),
  resetPasswordToken: joi.string().length(6),
  activationToken: joi.string().length(32),
  organization: joi.object().optional()
});

export const userCreationValidationSchema = joi.object().keys({
  email: joi.string().email({ minDomainSegments: 2 }),
  password: joi.string().min(6),
  organization: joi.object().optional()
});

export const organizationValidationSchema = joi.object().keys({
  organization: joi.object().keys({
    name: joi.string().max(50).required().messages({
      'string.base': 'Organization name must be a string.',
      'string.empty': 'Organization name cannot be empty.',
      'string.max': 'Organization name should have a maximum length of {#limit}.',
      'any.required': 'An organization name is required.'
    })
  })
});

export const voiceInputValidationSchema = joi.object().keys({
  id: joi.string().uuid(),
  voiceId: joi.string().uuid()
});

export const userVoiceSettingValidationSchema = joi.object().keys({
  id: joi.string().uuid(),
  voiceId: joi.string().uuid(),
  languageId: joi.string().uuid()
});

export const apiKeyInputValidationSchema = joi.object().keys({
  label: joi.string(),
  apiKeyId: joi.string().uuid(),
  allowedDomain: joi.string()
});
