import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountSection } from "../components/AccountSection";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
	return (
		<main className="flex flex-col w-md grow-1 p-8">
			<h1 className="text-4xl font-bold text-center mt-4">Account</h1>
			<AccountSection />
			<Link className="mt-16 inline-block w-fit mx-auto" to="/">
				Back to home
			</Link>
		</main>
	);
}
