import { redirect } from "next/navigation";
import { Headset, ShieldCheck, Laptop, MessageSquare } from "lucide-react";
import { currentUser } from "@/lib/current-user";
import LoginForm from "@/components/login-form";
export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <main className="login-layout">
      <section className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <Headset size={23} />
          </span>
          TechDesk<span className="brand-dot">.</span>
        </div>
        <div className="story-content">
          <p className="eyebrow light">YOUR IT SUPPORT WORKSPACE</p>
          <h1>
            Less friction.
            <br />
            More focus.
          </h1>
          <p>
            Get the help you need, keep every conversation in one place, and get
            back to your day.
          </p>
          <div className="story-features">
            <div>
              <MessageSquare size={20} /> Clear conversations
            </div>
            <div>
              <Laptop size={20} /> Connected equipment
            </div>
            <div>
              <ShieldCheck size={20} /> Access you can trust
            </div>
          </div>
        </div>
        <p className="story-footer">IT support, organized.</p>
      </section>
      <section className="login-form-section">
        <div className="login-card">
          <span className="pill neutral">SUPPORT STARTS HERE</span>
          <h2>Welcome back</h2>
          <p className="muted">
            Sign in to submit an issue and follow its progress.
          </p>
          <LoginForm />
          <p className="login-note">
            Need an account? Contact your IT administrator.
          </p>
          {process.env.SHOW_DEMO_ACCOUNTS === "true" && (
            <details className="demo-note">
              <summary>Local fictional demo accounts</summary>
              <p>
                Employee: employee@techdesk.example
                <br />
                Technician: technician@techdesk.example
                <br />
                Administrator: admin@techdesk.example
              </p>
              <p>Use your local DEMO_PASSWORD from .env.local.</p>
            </details>
          )}
        </div>
      </section>
    </main>
  );
}
