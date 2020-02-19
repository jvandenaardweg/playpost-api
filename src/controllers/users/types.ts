export interface PostUsersRequestBody {
  email: string;
  password: string;
  organization?: {
    name: string
  };
}
