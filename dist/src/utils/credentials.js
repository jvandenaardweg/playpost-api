"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Create the required Google Cloud Credentials based on env variables
// So we can use it on any platform and not store our credentials in git
exports.getGoogleCloudCredentials = () => {
    return {
        projectId: process.env.GOOGLE_CLOUD_CREDENTIALS_PROJECT_ID,
        credentials: {
            client_email: process.env.GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY,
        }
    };
};
//# sourceMappingURL=credentials.js.map