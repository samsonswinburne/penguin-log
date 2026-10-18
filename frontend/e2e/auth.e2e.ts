import { expect, test } from "@playwright/test";

test("a new user can sign up, open the app, and log out", async ({ page }) => {
	const email = `e2e-${crypto.randomUUID()}@example.test`;

	await page.goto("/auth");
	await page.waitForLoadState("networkidle");
	await page.getByRole("tab", { name: "Sign up" }).click();
	await expect(page.getByRole("tab", { name: "Sign up" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill("test-password-123");
	await page.getByRole("button", { name: "Sign up" }).click();

	await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
	await page.goto("/app");
	await expect(
		page.getByRole("heading", { name: "My PenguinLog" }),
	).toBeVisible();

	await page.goto("/auth");
	await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
	await page.getByRole("button", { name: "Log out" }).click();
	await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
	await page.goto("/app");
	await expect(page).toHaveURL(/\/auth$/);
});
