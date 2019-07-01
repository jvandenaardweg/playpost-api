import joi from 'joi';

export const articleInputValidationSchema = joi.object().keys({
  articleUrl: joi.string().uri(),
  articleId: joi.string().uuid()
});

export const audiofileInputValidationSchema = joi.object().keys({
  userId: joi.string().uuid(),
  playlistId: joi.string().uuid(),
  articleId: joi.string().uuid(),
  voiceId: joi.string().uuid(),
  name: joi.string(),
  articleUrl: joi.string().uri(),
  audiofileId: joi.string().uuid(),
  mimeType: joi.string()
});

export const subscriptionPurchaseValidationSchema = joi.object().keys({
  receipt: joi.string(),
  productId: joi.string(),
  inAppSubscriptionId: joi.string().uuid()
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
  favoritedAt: joi.alternatives().try(joi.string().allow(null))
});

export const userInputValidationSchema = joi.object().keys({
  id: joi.string().uuid(),
  userId: joi.string().uuid(),
  email: joi.string().email({ minDomainAtoms: 2 }),
  password: joi.string().min(6),
  resetPasswordToken: joi.string().length(6)
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
