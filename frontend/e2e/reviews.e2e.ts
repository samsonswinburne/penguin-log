import { expect, type Page, test } from "@playwright/test";

async function signUp(page: Page) {
	const email = `e2e-${crypto.randomUUID()}@example.test`;
	await page.goto("/auth");
	await page.waitForLoadState("networkidle");
	await page.getByText("Don't have an account?").click();
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill("test-password-123");
	await page.getByRole("button", { name: "Sign up" }).click();
	await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
}

// Picks the first game in a genre from the catalogue and opens its page.
async function openFirstGame(page: Page, genre: string) {
	await page.goto("/games");
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Genre").selectOption({ label: genre });
	const firstGame = page.getByRole("main").getByRole("listitem").first();
	await expect(firstGame).toContainText(genre);

	const name = (await firstGame.getByRole("link").textContent()) ?? "";
	await firstGame.getByRole("link").click();
	await expect(
		page.getByRole("heading", { level: 1, name, exact: true }),
	).toBeVisible();
	return name;
}

test("a user can review a game and see it on their profile", async ({
	page,
}) => {
	await signUp(page);
	const displayName = `Tux ${crypto.randomUUID().slice(0, 8)}`;
	await page.goto("/app");
	await page.getByLabel("Display name").fill(displayName);
	await page.getByRole("button", { name: "Save profile" }).click();
	await expect(page.getByText("Profile saved.")).toBeVisible();

	const gameName = await openFirstGame(page, "Platform");
	const comment = `E2E review ${crypto.randomUUID()}`;
	await page.getByLabel("Rating").selectOption("9");
	await page.getByLabel("Comment").fill(comment);
	await page.getByRole("button", { name: "Post review" }).click();
	await expect(page.getByRole("button", { name: "Save review" })).toBeVisible();

	await page.getByRole("button", { name: "Add to want to play" }).click();
	await expect(
		page.getByRole("button", { name: "Remove from want to play" }),
	).toBeVisible();

	const review = page.getByRole("listitem").filter({ hasText: comment });
	await expect(review).toContainText("9 / 10");
	await review.getByRole("link", { name: displayName }).click();

	await expect(
		page.getByRole("heading", { level: 1, name: displayName }),
	).toBeVisible();
	const reviews = page
		.locator("section")
		.filter({ has: page.getByRole("heading", { name: "Reviews" }) });
	await expect(reviews).toContainText(comment);
	await expect(reviews).toContainText(gameName);
	const backlog = page
		.locator("section")
		.filter({ has: page.getByRole("heading", { name: "Want to play" }) });
	await expect(backlog.getByRole("link", { name: gameName })).toBeVisible();
});

test("a user can edit and delete their review", async ({ page }) => {
	await signUp(page);
	await openFirstGame(page, "Puzzle");
	const comment = `Lost interest later ${crypto.randomUUID()}`;

	await page.getByLabel("Comment").fill("First impressions");
	await page.getByRole("button", { name: "Post review" }).click();
	await expect(page.getByRole("button", { name: "Save review" })).toBeVisible();

	await page.getByLabel("Rating").selectOption("4");
	await page.getByLabel("Comment").fill(comment);
	await page.getByRole("button", { name: "Save review" }).click();
	const review = page.getByRole("listitem").filter({ hasText: comment });
	await expect(review).toContainText("4 / 10");

	await page.getByRole("button", { name: "Delete review" }).click();
	await expect(page.getByRole("button", { name: "Post review" })).toBeVisible();
	await expect(review).toHaveCount(0);
});
