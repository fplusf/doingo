import { useAuth } from '@/features/auth/auth-context';
import { Button } from '@/shared/components/ui/button';
import React from 'react';

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-10 bg-background p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-muted-foreground sm:text-5xl">
          Filter through the noise, focus on what matters and get things done.
        </h1>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 text-center shadow-lg">
        <img src="logo.png" alt="Optimal ADHD logo" className="mx-auto mb-6 h-16 w-16" />
        <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome to Doingo</h1>
        <p className="mb-8 text-muted-foreground">Sign in to continue to your dashboard</p>
        <Button onClick={signInWithGoogle} size="lg" className="w-full">
          <svg
            className="mr-2 h-5 w-5"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c71.2 0 133 28.1 176.2 72.9l-63.7 61.9C333.6 112.5 291.1 96 244 96 165.2 96 99.4 159.2 99.4 256s65.8 160 144.6 160c87.7 0 119.9-57.6 124.2-87.2H244v-75.2h238.2c2.6 13.2 4 27.6 4 43z"
            ></path>
          </svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
