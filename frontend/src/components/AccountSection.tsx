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
		<section className="flex flex-col grow-1 w-full mt-8 space-y-4">
			{user ? (
				<div className="h-full flex flex-col justify-center grow-1">
					<p className="text-center mb-4">Signed in as {user.email}</p>
					<button type="button" className="btn-danger" onClick={() => void logOut()}>
						Log out
					</button>
				</div>
			) : (
				<div className="my-auto w-full">
					{authMode === "login" ? (
						<>
							<LoginForm onAuthenticated={setUser} />
							<p className="fakeLink mt-5 block mx-auto w-fit" onKeyUp={() => setAuthMode("signup")} onClick={() => setAuthMode("signup")}>
							Don't have an account?
							</p>
						</>
						) : (
						<>
							<SignupForm onAuthenticated={setUser} />
							<p className="fakeLink mt-5 block mx-auto w-fit" onKeyUp={() => setAuthMode("login")} onClick={() => setAuthMode("login")}>
							Already have an account?
							</p>
						</>
						)}
				</div>
			)}
		</section>
	);
}
