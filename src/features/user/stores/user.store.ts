import { Store } from '@tanstack/react-store';

export interface User {
  name: string;
  email: string;
  avatar: string;
}

const mockUser: User = {
  name: 'Optimal ADHD',
  email: 'user@example.com',
  avatar: 'https://github.com/shadcn.png',
};

export const userStore = new Store<User>(mockUser);
