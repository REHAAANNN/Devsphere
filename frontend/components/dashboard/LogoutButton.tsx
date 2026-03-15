'use client';

import { SignOutButton } from "@clerk/nextjs";
import styles from './logout-button.module.css';

export default function LogoutButton() {
  return (
    <SignOutButton>
      <button className={styles.logoutButton}>
        Logout
      </button>
    </SignOutButton>
  );
}
