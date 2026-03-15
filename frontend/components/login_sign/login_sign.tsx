import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";

import Page from "../dashboard/page"

export default function LoginSign() {
  return (
    <>
      <SignedOut>
        <div className="container">
          <div className="card">
            <h2>Welcome to Devsphere 🚀</h2>
            <div className="btn-group">
              <SignInButton mode="modal">
                <button className="btn primary">Sign In</button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="btn secondary">Sign Up</button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <Page />
      </SignedIn>
    </>
  );
}
