export type User = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type UserResponse = {
  user: User & { token: string } & { tokenExpiration: number };
};
