export interface PostAuthResponse {
  token: string;
  expiresAt: string | null;
  expiresAtMs: number | null;
  issuedAt: string | null;
  issuedAtMs: number | null;
}

export interface PostAuthResetPasswordRequestBody {
  email: string;
}

export interface PatchAuthActivateRequestBody {
  activationToken: string;
}

export interface PostAuthUpdatePasswordMobileRequestBody {
  resetPasswordToken: string;
  password: string;
}

export interface PostAuthResetPasswordMobileRequestBody {
  email: string;
}

export interface PostAuthRequestBody {
  email: string;
  password: string;
}
