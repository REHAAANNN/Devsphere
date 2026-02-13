import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();

  return (
    <div style={{ padding: "40px",  color:"black"}}>
      <h1>🚀 DevSphere Dashboard</h1>
      <p>Welcome {user?.firstName}</p>

      <h3>Platform Features:</h3>
      <ul>
        <li>💻 Real-time Code Collaboration</li>
        <li>📁 Project Management</li>
        <li>🤖 AI Assisted Development</li>
        <li>👥 Developer Community</li>
        <li>📊 Analytics & Leaderboard</li>
      </ul>
    </div>
  );
}


