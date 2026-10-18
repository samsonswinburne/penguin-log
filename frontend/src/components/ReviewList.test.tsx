import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { Review } from "../lib/api";
import { renderWithRouter } from "../test-utils";
import { GameList } from "./GameList";
import { ReviewList } from "./ReviewList";

afterEach(cleanup);

const review: Review = {
	id: 1,
	rating: 9,
	comment: "Tough but fair.",
	created_at: "2026-10-18T00:00:00Z",
	updated_at: "2026-10-18T00:00:00Z",
	game: { id: 4, name: "Celeste" },
	user: { id: 2, display_name: "Tux" },
};

test("on a game page reviews link to their author", async () => {
	renderWithRouter(<ReviewList reviews={[review]} label="author" />);

	const link = await screen.findByRole("link", { name: "Tux" });
	expect(link.getAttribute("href")).toBe("/users/2");
	expect(screen.getByText("9 / 10")).toBeTruthy();
	expect(screen.getByText("Tough but fair.")).toBeTruthy();
});

test("on a profile reviews link to their game", async () => {
	renderWithRouter(<ReviewList reviews={[review]} label="game" />);

	const link = await screen.findByRole("link", { name: "Celeste" });
	expect(link.getAttribute("href")).toBe("/games/4");
});

test("says when there are no reviews", async () => {
	renderWithRouter(<ReviewList reviews={[]} label="author" />);

	expect(await screen.findByText("No reviews yet.")).toBeTruthy();
});

test("game list links each game with its year and genres", async () => {
	renderWithRouter(
		<GameList
			empty="Nothing here."
			games={[
				{
					id: 4,
					name: "Celeste",
					slug: "celeste",
					release_date: "2018-01-26",
					genres: [
						{ id: 32, name: "Indie" },
						{ id: 8, name: "Platform" },
					],
				},
			]}
		/>,
	);

	const link = await screen.findByRole("link", { name: "Celeste" });
	expect(link.getAttribute("href")).toBe("/games/4");
	expect(screen.getByText("2018 · Indie, Platform")).toBeTruthy();
});

test("game list shows its empty message", async () => {
	renderWithRouter(<GameList games={[]} empty="Nothing here." />);

	expect(await screen.findByText("Nothing here.")).toBeTruthy();
});
