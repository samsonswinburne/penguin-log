import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { clearToken, getToken, hasToken, saveToken } from "../lib/token";
import { AuthComponent } from "./AuthComponent";

afterEach(() => {
	cleanup();
	clearToken();
});

test("shows the fallback when no token is stored", () => {
	render(
		<AuthComponent fallback={<p>Log in first</p>}>
			{(token) => <p>Token: {token}</p>}
		</AuthComponent>,
	);
	expect(screen.getByText("Log in first")).toBeTruthy();
	expect(hasToken()).toBe(false);
});

test("reads a stored token when the component opens", async () => {
	saveToken("test-token");
	render(
		<AuthComponent fallback={<p>Log in first</p>}>
			{(token) => <p>Token: {token}</p>}
		</AuthComponent>,
	);

	expect(getToken()).toBe("test-token");
	expect(hasToken()).toBe(true);
	expect(await screen.findByText("Token: test-token")).toBeTruthy();
});
