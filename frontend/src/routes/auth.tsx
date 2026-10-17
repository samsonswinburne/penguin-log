import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountSection } from "../components/AccountSection";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
	return (
		<main className="p-8">
			<h1 className="text-4xl font-bold">Account</h1>
			<AccountSection />
			<Link className="mt-8 inline-block" to="/">
				Back to home
			</Link>
		</main>
	);
}
