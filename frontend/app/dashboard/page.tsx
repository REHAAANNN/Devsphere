import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/dashboard/page';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  const firstName = user?.firstName?.trim() || 'Developer';

  return <Dashboard firstName={firstName} />;
}
