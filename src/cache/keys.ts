export const jwtVerifyUser = (userId: string) => `jwt:verify:user:${userId}`;
export const apiKeyUser = (apiKey: string) => `apikey:${apiKey}:user`;
