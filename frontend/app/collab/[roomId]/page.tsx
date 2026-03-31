import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import RealtimeEditor from '@/components/collab/RealtimeEditor';

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
    >
      <RealtimeEditor
        roomId={roomId}
        userId={userId}
        userName={user?.firstName?.trim() || user?.username || 'Developer'}
      />
    </AppShell>
  );
}
