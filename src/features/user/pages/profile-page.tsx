import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { useStore } from '@tanstack/react-store';
import { userStore } from '../stores/user.store';
import React from 'react';

const ProfilePage: React.FC = () => {
  const user = useStore(userStore, (state) => state);

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <div className="flex w-full justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 text-center">{user.name}</CardTitle>
          <CardDescription className="text-center">{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center">
            This information is provided by the mock Google authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
