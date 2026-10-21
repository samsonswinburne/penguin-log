import { useState } from "react";
import { login, signup, type User } from "../lib/auth";

type AuthFormProps = {
	mode: "login" | "signup";
	onAuthenticated: (user: User) => void;
};

export function AuthForm({ mode, onAuthenticated }: AuthFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);

	async function submit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setMessage("");
		try {
			const user =
				mode === "signup"
					? await signup(email, password)
					: await login(email, password);
			setPassword("");
			onAuthenticated(user);
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Something went wrong.",
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<form className="w-full space-y-4" onSubmit={(event) => void submit(event)}>
			<label className="block w-full">
				<p className="p-1 mb-1 text-lg">Email</p>
				<input
					className="block w-full border p-2"
					type="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					minLength={10}
					required
				/>
			</label>
			<label className="block">
				<p className="p-1 mb-1 text-lg">Password</p>
				<input
					className="block w-full border p-2"
					type="password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					minLength={10}
					required
				/>
			</label>
			<button
				type="submit"
				disabled={busy}
				className="mt-[1rem] ml-auto w-full btn-primary"
			>
				{mode === "signup" ? "Sign up" : "Log in"}
			</button>
			{message && (
				<p role="alert" className="text-red-400 text-center">
					{message}
				</p>
			)}
		</form>
	);
}
