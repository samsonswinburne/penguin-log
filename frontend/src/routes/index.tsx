import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

type User = { id: number; email: string };
type LoginResponse = User & { token: string; expires_at: number };

export function Home() {
	const [status, setStatus] = useState("Checking backend…");
	const [user, setUser] = useState<User | null>(null);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		fetch("/api/health")
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json();
			})
			.then((data) => setStatus(data.status))
			.catch(() => setStatus("Backend unavailable"));

		const token = sessionStorage.getItem("penguinlog_token");
		if (token) {
			fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
				.then((response) => {
					if (!response.ok) throw new Error("Session expired");
					return response.json();
				})
				.then((currentUser: User) => setUser(currentUser))
				.catch(() => sessionStorage.removeItem("penguinlog_token"));
		}
	}, []);

	async function logIn() {
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (!response.ok)
			throw new Error("Login failed. Check your email and password.");
		const result = (await response.json()) as LoginResponse;
		sessionStorage.setItem("penguinlog_token", result.token);
		setUser({ id: result.id, email: result.email });
		setPassword("");
		setMessage("");
	}

	async function submit(mode: "login" | "register") {
		if (email.length < 10 || password.length < 10) {
			setMessage(
				"Email and password must each contain at least 10 characters.",
			);
			return;
		}
		setBusy(true);
		setMessage("");
		try {
			if (mode === "register") {
				const response = await fetch("/api/auth/register", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				});
				if (!response.ok) {
					throw new Error(
						response.status === 409
							? "Email already registered."
							: "Registration failed.",
					);
				}
			}
			await logIn();
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Something went wrong.",
			);
		} finally {
			setBusy(false);
		}
	}

	async function logOut() {
		const token = sessionStorage.getItem("penguinlog_token");
		try {
			if (token) {
				await fetch("/api/auth/logout", {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				});
			}
		} finally {
			sessionStorage.removeItem("penguinlog_token");
			setUser(null);
		}
	}

	return (
		<main className="p-8">
			<h1 className="text-4xl font-bold">PenguinLog</h1>
			<p className="mt-4">Backend status: {status}</p>
			<section className="mt-8 max-w-sm space-y-4">
				{user ? (
					<>
						<p>Signed in as {user.email}</p>
						<button type="button" onClick={() => void logOut()}>
							Log out
						</button>
					</>
				) : (
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void submit("login");
						}}
					>
						<label className="block">
							Email
							<input
								className="block w-full border p-2"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
							/>
						</label>
						<label className="block">
							Password
							<input
								className="block w-full border p-2"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								minLength={10}
								required
							/>
						</label>
						<div className="flex gap-4">
							<button type="submit" disabled={busy}>
								Log in
							</button>
							<button
								type="button"
								disabled={busy}
								onClick={() => void submit("register")}
							>
								Register
							</button>
						</div>
						{message && <p role="alert">{message}</p>}
					</form>
				)}
			</section>
		</main>
	);
}
