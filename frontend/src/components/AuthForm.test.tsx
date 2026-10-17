import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AuthForm } from "./AuthForm";

afterEach(() => {
	cleanup();
	sessionStorage.clear();
	vi.unstubAllGlobals();
});

function fillForm(email: string, password: string) {
	fireEvent.change(screen.getByLabelText("Email"), {
		target: { value: email },
	});
	fireEvent.change(screen.getByLabelText("Password"), {
		target: { value: password },
	});
}

test("login form signs in and passes the user to its parent", async () => {
	const onAuthenticated = vi.fn();
	const fetchMock = vi.fn(async () => ({
		ok: true,
		json: async () => ({
			id: 2,
			email: "login@example.com",
			token: "login-token",
		}),
	}));
	vi.stubGlobal("fetch", fetchMock);

	render(<AuthForm mode="login" onAuthenticated={onAuthenticated} />);
	fillForm("login@example.com", "test-password");
	fireEvent.click(screen.getByRole("button", { name: "Log in" }));

	await waitFor(() => {
		expect(onAuthenticated).toHaveBeenCalledWith({
			id: 2,
			email: "login@example.com",
		});
	});
	expect(fetchMock).toHaveBeenCalledWith(
		"/api/auth/login",
		expect.objectContaining({
			method: "POST",
			body: JSON.stringify({
				email: "login@example.com",
				password: "test-password",
			}),
		}),
	);
	expect(sessionStorage.getItem("penguinlog_token")).toBe("login-token");
});

test("signup form registers, signs in, and passes the user to its parent", async () => {
	const onAuthenticated = vi.fn();
	const fetchMock = vi.fn(async (input: string) =>
		input === "/api/auth/register"
			? { ok: true }
			: {
					ok: true,
					json: async () => ({
						id: 1,
						email: "signup@example.com",
						token: "signup-token",
					}),
				},
	);
	vi.stubGlobal("fetch", fetchMock);

	render(<AuthForm mode="signup" onAuthenticated={onAuthenticated} />);
	fillForm("signup@example.com", "test-password");
	fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

	await waitFor(() => {
		expect(onAuthenticated).toHaveBeenCalledWith({
			id: 1,
			email: "signup@example.com",
		});
	});
	expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
		"/api/auth/register",
		"/api/auth/login",
	]);
	expect(fetchMock).toHaveBeenCalledWith(
		"/api/auth/register",
		expect.objectContaining({
			method: "POST",
			body: JSON.stringify({
				email: "signup@example.com",
				password: "test-password",
			}),
		}),
	);
	expect(sessionStorage.getItem("penguinlog_token")).toBe("signup-token");
});

test("login form shows an error for rejected credentials", async () => {
	const onAuthenticated = vi.fn();
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => ({ ok: false, status: 401 })),
	);

	render(<AuthForm mode="login" onAuthenticated={onAuthenticated} />);
	fillForm("login@example.com", "bad-password");
	fireEvent.click(screen.getByRole("button", { name: "Log in" }));

	expect((await screen.findByRole("alert")).textContent).toBe(
		"Login failed. Check your email and password.",
	);
	expect(onAuthenticated).not.toHaveBeenCalled();
	expect(sessionStorage.getItem("penguinlog_token")).toBeNull();
});

test("signup form shows a registration error", async () => {
	const onAuthenticated = vi.fn();
	const fetchMock = vi.fn(async () => ({ ok: false, status: 409 }));
	vi.stubGlobal("fetch", fetchMock);

	render(<AuthForm mode="signup" onAuthenticated={onAuthenticated} />);
	fillForm("signup@example.com", "test-password");
	fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

	expect((await screen.findByRole("alert")).textContent).toBe(
		"Email already registered.",
	);
	expect(fetchMock).toHaveBeenCalledTimes(1);
	expect(onAuthenticated).not.toHaveBeenCalled();
});
