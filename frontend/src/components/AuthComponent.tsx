import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getToken } from "../lib/token";

export function useAuthToken() {
	const [token, setToken] = useState<string | null>(null);
	useEffect(() => setToken(getToken()), []);
	return { token, isLoggedIn: token !== null };
}

export function AuthComponent({
	children,
	fallback = null,
}: {
	children: (token: string) => ReactNode;
	fallback?: ReactNode;
}) {
	const { token } = useAuthToken();
	return token ? children(token) : fallback;
}
