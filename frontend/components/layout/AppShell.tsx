import { ReactNode } from 'react';
import styles from './app-shell.module.css';

type AppShellProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

export default function AppShell({ title, subtitle, rightSlot, children }: AppShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <span className={styles.logo} aria-hidden="true">
            🚀
          </span>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
        </div>
        {rightSlot ? <div className={styles.actions}>{rightSlot}</div> : null}
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
