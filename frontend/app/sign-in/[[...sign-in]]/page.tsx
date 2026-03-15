import { auth } from '@clerk/nextjs/server';
import { SignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import styles from './sign-in.module.css';

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <AppShell title="DevSphere" subtitle="Sign in to continue your workspace.">
      <div className={styles.signInCard}>
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </AppShell>
  );
}
