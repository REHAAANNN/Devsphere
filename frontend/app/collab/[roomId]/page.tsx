import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import RealtimeEditor from '@/components/collab/RealtimeEditor';
import styles from './page.module.css';

type CollabRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function CollabRoomPage({ params }: CollabRoomPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  const { roomId } = await params;

  return (
    <AppShell
      title="Live Collaboration"
      subtitle={`Room: ${roomId}`}
      rightSlot={
        <Link href="/" className={styles.backHomeButton}>
          Back to Home
        </Link>
      }
    >
      <RealtimeEditor
        roomId={roomId}
        userId={userId}
        userName={user?.firstName?.trim() || user?.username || 'Developer'}
      />
    </AppShell>
  );
}
