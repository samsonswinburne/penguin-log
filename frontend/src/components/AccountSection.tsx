import { useEffect, useState } from "react";
import { logout, restoreUser, type User } from "../lib/auth";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export function AccountSection() {
	const [user, setUser] = useState<User | null>(null);
	const [authMode, setAuthMode] = useState<"login" | "signup">("login");

	useEffect(() => {
		void restoreUser().then(setUser);
	}, []);

	async function logOut() {
		try {
			await logout();
		} finally {
			setUser(null);
		}
	}

	return (
		<section className="mt-8 max-w-sm space-y-4">
			{user ? (
				<>
					<p>Signed in as {user.email}</p>
					<button type="button" onClick={() => void logOut()}>
						Log out
					</button>
				</>
			) : (
				<>
					<div className="flex gap-4" role="tablist" aria-label="Account">
						<button
							type="button"
							role="tab"
							aria-selected={authMode === "login"}
							onClick={() => setAuthMode("login")}
						>
							Log in
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={authMode === "signup"}
							onClick={() => setAuthMode("signup")}
						>
							Sign up
						</button>
					</div>
					{authMode === "login" ? (
						<LoginForm onAuthenticated={setUser} />
					) : (
						<SignupForm onAuthenticated={setUser} />
					)}
				</>
			)}
		</section>
	);
}
