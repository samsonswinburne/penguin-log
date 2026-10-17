const tokenKey = "penguinlog_token";

export function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return window.sessionStorage.getItem(tokenKey) || null;
}

export function hasToken(): boolean {
	return getToken() !== null;
}

export function saveToken(token: string): void {
	window.sessionStorage.setItem(tokenKey, token);
}

export function clearToken(): void {
	window.sessionStorage.removeItem(tokenKey);
}
