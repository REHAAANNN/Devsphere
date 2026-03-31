import { auth } from '@clerk/nextjs/server';
import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import styles from './sign-up.module.css';

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <AppShell title="DevSphere" subtitle="Create your account to start building.">
      <div className={styles.signUpCard}>
        <SignUp forceRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </div>
    </AppShell>
  );
}
