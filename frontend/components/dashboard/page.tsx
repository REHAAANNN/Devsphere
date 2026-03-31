import Link from 'next/link';
import LogoutButton from "./LogoutButton";
import AppShell from '@/components/layout/AppShell';
import styles from './dashboard.module.css';

type DashboardProps = {
  firstName: string;
};

const features = [
  { icon: '💻', title: 'Real-time Code Collaboration', desc: 'Open a shared room and edit live' },
  { icon: '📁', title: 'Project Management', desc: 'Organize your projects' },
  { icon: '🤖', title: 'AI Assisted Development', desc: 'Smart coding assistance' },
  { icon: '👥', title: 'Developer Community', desc: 'Connect with developers' },
  { icon: '📊', title: 'Analytics & Leaderboard', desc: 'Track your progress' },
];

export default function Dashboard({ firstName }: DashboardProps) {

  return (
    <AppShell title="DevSphere" rightSlot={<LogoutButton />}>
      <section className={styles.welcomeCard}>
        <h2 className={styles.welcomeTitle}>Welcome back, {firstName}! 👋</h2>
        <p className={styles.welcomeSubtitle}>Ready to build something amazing today?</p>
        <Link href="/collab/devsphere-room" className={styles.primaryAction}>
          Launch Real-time Collaboration
        </Link>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Platform Features</h3>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h4 className={styles.featureTitle}>{feature.title}</h4>
              <p className={styles.featureDescription}>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}


