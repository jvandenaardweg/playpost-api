import { Response } from 'express';
import { User } from '../../database/entities/user';

export interface PatchOneUserRequestBody {
  email?: string;
  newPassword?: string;
  currentPassword?: string;
}

export interface UserResponse extends Response {
  locals: {
    user: User;
  }
}
