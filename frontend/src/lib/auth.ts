import { clearToken, getToken, saveToken } from "./token";

export type User = { id: number; email: string };
type LoginResponse = User & { token: string; expires_at: number };

export async function login(email: string, password: string): Promise<User> {
	const response = await fetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	if (!response.ok)
		throw new Error("Login failed. Check your email and password.");

	const result = (await response.json()) as LoginResponse;
	saveToken(result.token);
	return { id: result.id, email: result.email };
}

export async function signup(email: string, password: string): Promise<User> {
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
	return login(email, password);
}

export async function restoreUser(): Promise<User | null> {
	const token = getToken();
	if (!token) return null;

	try {
		const response = await fetch("/api/auth/me", {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!response.ok) throw new Error("Session expired");
		return (await response.json()) as User;
	} catch {
		clearToken();
		return null;
	}
}

export async function logout(): Promise<void> {
	const token = getToken();
	try {
		if (token) {
			await fetch("/api/auth/logout", {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});
		}
	} finally {
		clearToken();
	}
}
