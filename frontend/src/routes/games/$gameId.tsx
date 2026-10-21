import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ReviewForm } from "../../components/ReviewForm";
import { ReviewList } from "../../components/ReviewList";
import {
	createReview,
	deleteReview,
	type GameDetail,
	type GameList,
	type GameState,
	getGame,
	getGameState,
	releaseYear,
	setInList,
	updateReview,
} from "../../lib/api";
import { hasToken } from "../../lib/token";

export const Route = createFileRoute("/games/$gameId")({ component: GamePage });

function GamePage() {
	const gameId = Number(Route.useParams().gameId);
	const [game, setGame] = useState<GameDetail | null>(null);
	const [state, setState] = useState<GameState | null>(null);
	const [signedIn, setSignedIn] = useState(false);
	const [error, setError] = useState("");
	const [longSummaryVisible, setLongSummary] = useState(false);

	const load = useCallback(async () => {
		try {
			setGame(await getGame(gameId));
		} catch {
			setError("Game not found.");
			return;
		}
		if (hasToken()) {
			setSignedIn(true);
			setState(await getGameState(gameId).catch(() => null));
		}
	}, [gameId]);

	useEffect(() => {
		void load();
	}, [load]);

	async function toggle(list: GameList, included: boolean) {
		await setInList(list, gameId, included);
		await load();
	}

	if (error) return <main className="p-8">{error}</main>;
	if (game === null) return <main className="p-8">Loading…</main>;

	const maxSummaryLength = 400;

	function shortenSummary(str: string) {
		if (str.length <= maxSummaryLength) return [str, ""];

		const lastSpace = str.lastIndexOf(" ", maxSummaryLength);
		const sliceIndex = lastSpace > 0 ? lastSpace : maxSummaryLength;
		return `${str.slice(0, sliceIndex)} ...`;
	}

	return (
		<main className="max-w-3xl p-8">
			<h1 className="text-4xl font-bold mt-4 mb-4">{game.name}</h1>
			<p className="mt-2 text-gray-600">
				{releaseYear(game)}
				{game.genres.length > 0 &&
					` · ${game.genres.map((genre) => genre.name).join(", ")}`}
			</p>
			<p className="mt-2">
				{game.average_rating === null
					? "Not rated yet"
					: `Average rating: ${game.average_rating} / 10 (${game.review_count} ${game.review_count === 1 ? "review" : "reviews"})`}
			</p>
			{game.summary && (
				<div>
					<p className="inline mt-4">
						{longSummaryVisible ? game.summary : shortenSummary(game.summary)}
					</p>
					{game.summary?.length > maxSummaryLength && (
						<p
							id="summaryToggle"
							className="fakeLink inline ml-2 text-blue-500 w-fit"
							onClick={() => {
								setLongSummary(!longSummaryVisible);
							}}
							onKeyDown={() => {
								setLongSummary(!longSummaryVisible);
							}}
						>
							{longSummaryVisible ? "Hide" : "Read more"}
						</p>
					)}
				</div>
			)}
			{game.igdb_url && (
				<a className="block w-fit ml-auto mt-2" href={game.igdb_url}>
					View on IGDB
				</a>
			)}
			<hr className="my-4 opacity-50" />
			{signedIn && state ? (
				<section className="mt-8 space-y-4">
					<div className="flex gap-4 mb-5">
						<button
							className="border px-4 py-2 w-1/2"
							type="button"
							onClick={() => void toggle("favourites", !state.favourite)}
						>
							{state.favourite ? "Remove from favourites" : "Add to favourites"}
						</button>
						<button
							className="border px-4 py-2 w-1/2"
							type="button"
							onClick={() => void toggle("backlog", !state.backlog)}
						>
							{state.backlog
								? "Remove from want to play"
								: "Add to want to play"}
						</button>
					</div>
					<h2 className="text-2xl font-bold">Your review</h2>
					{state.review ? (
						<ReviewForm
							key={state.review.updated_at}
							initial={state.review}
							submitLabel="Save review"
							onSubmit={async (rating, comment) => {
								if (!state.review) return;
								await updateReview(state.review.id, rating, comment);
								await load();
							}}
							onDelete={async () => {
								if (!state.review) return;
								await deleteReview(state.review.id);
								await load();
							}}
						/>
					) : (
						<ReviewForm
							submitLabel="Post review"
							onSubmit={async (rating, comment) => {
								await createReview(gameId, rating, comment);
								await load();
							}}
						/>
					)}
				</section>
			) : (
				<p className="mt-8">
					<Link className="underline" to="/auth">
						Log in
					</Link>{" "}
					to review this game or add it to your lists.
				</p>
			)}

			<section className="mt-8">
				<h2 className="mb-4 text-2xl font-bold">Reviews</h2>
				<ReviewList reviews={game.reviews} label="author" />
			</section>
		</main>
	);
}
