import { ClerkProvider } from '@clerk/nextjs'
import LoginSign from '../components/login_sign/login_sign';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
       <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#7c3aed",        // Button color
          colorBackground: "#111827",     // Panel background
          colorText: "#f9fafb",           // Text color
          colorInputBackground: "#1f2937",
          borderRadius: "12px",
        },
        elements: {
          card: {
            backgroundColor: "#1e293b",   // Panel card color
          },
          headerTitle: {
            color: "#ffffff",
          },
          socialButtonsBlockButton: {
            backgroundColor: "#334155",
          }
        }
      }}
    >
      <html lang="en">
        <body>
          <LoginSign />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
