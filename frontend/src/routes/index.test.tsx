import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Home } from "./index";

afterEach(() => {
	cleanup();
	sessionStorage.clear();
	vi.unstubAllGlobals();
});

test("home page shows its heading", () => {
	render(<Home />);

	expect(screen.getByRole("heading", { name: "PenguinLog" })).toBeTruthy();
});

test("registers, keeps a token in the tab, and logs out", async () => {
	const fetchMock = vi.fn(async (input: string) => {
		if (input === "/api/health") {
			return { ok: true, json: async () => ({ status: "ok" }) };
		}
		if (input === "/api/auth/register") {
			return {
				ok: true,
				json: async () => ({ id: 1, email: "test@example.com" }),
			};
		}
		if (input === "/api/auth/login") {
			return {
				ok: true,
				json: async () => ({
					id: 1,
					email: "test@example.com",
					token: "test-token",
				}),
			};
		}
		return { ok: true, json: async () => ({}) };
	});
	vi.stubGlobal("fetch", fetchMock);

	render(<Home />);
	fireEvent.change(screen.getByLabelText("Email"), {
		target: { value: "test@example.com" },
	});
	fireEvent.change(screen.getByLabelText("Password"), {
		target: { value: "test-password" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Register" }));

	await waitFor(() => {
		expect(screen.getByText("Signed in as test@example.com")).toBeTruthy();
	});
	expect(sessionStorage.getItem("penguinlog_token")).toBe("test-token");

	fireEvent.click(screen.getByRole("button", { name: "Log out" }));
	await waitFor(() => {
		expect(sessionStorage.getItem("penguinlog_token")).toBeNull();
	});
});
