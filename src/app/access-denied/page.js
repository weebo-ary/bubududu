import Link from "next/link";
import Bears from "@/components/bears";
export default function Page() {
  return (
    <main>
      <div className="login-card">
        <Bears small />
        <span className="eyebrow">THIS LITTLE CORNER IS PRIVATE</span>
        <h1>Only for Bubu &amp; Dudu!</h1>
        <p>
          This account is not on our little guest list. Our public love story is
          always here to explore.
        </p>
        <Link href="/" className="button">
          Back to our little world
        </Link>
        <p>
          <Link className="text-link" href="/dashboard">
            Try a different account
          </Link>
        </p>
      </div>
    </main>
  );
}
