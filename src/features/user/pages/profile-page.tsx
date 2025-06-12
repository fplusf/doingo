import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { useAuth } from '@/features/auth/auth-context';
import React from 'react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="p-6 text-center text-sm">You are not logged in.</div>
    );
  }

  const name = (user.user_metadata as any)?.full_name ?? user.email ?? '';
  const email = user.email ?? '';
  const avatar = (user.user_metadata as any)?.avatar_url ?? '';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <div className="flex w-full justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 text-center">{name}</CardTitle>
          <CardDescription className="text-center">{email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center">
            This information comes from your Google account via Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
