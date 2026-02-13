import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import  "../global.css";
import Page from "../dashboard/page"

export default function LoginSign() {
  return (
    <div className="container">
      <div className="card">
        <h2>Welcome to Devsphere 🚀</h2>

        <SignedOut>
          <div className="btn-group">
            <SignInButton mode="modal">
              <button className="btn primary">Sign In</button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="btn secondary">Sign Up</button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="user-section">
            <Page />
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
