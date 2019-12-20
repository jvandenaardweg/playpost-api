export interface CreateUserRequestBody {
  email: string;
  password: string;
  organization?: {
    name: string
  };
}
