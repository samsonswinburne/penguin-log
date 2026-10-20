import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameList } from "../../components/GameList";
import { GenreFilter } from "../../components/GenreFilter";
import {
	type GamePage,
	type Genre,
	listGames,
	listGenres,
} from "../../lib/api";

const pageSize = 25;

type GamesSearch = { genre?: number; q?: string; page?: number };

export const Route = createFileRoute("/games/")({
	validateSearch: (search: Record<string, unknown>): GamesSearch => ({
		genre: Number(search.genre) || undefined,
		q: typeof search.q === "string" && search.q ? search.q : undefined,
		page: Number(search.page) > 1 ? Number(search.page) : undefined,
	}),
	component: GamesPage,
});

function GamesPage() {
	const { genre, q, page = 1 } = Route.useSearch();
	const navigate = Route.useNavigate();
	const [genres, setGenres] = useState<Genre[]>([]);
	const [result, setResult] = useState<GamePage | null>(null);
	const [error, setError] = useState("");
	const [query, setQuery] = useState(q ?? "");

	useEffect(() => {
		listGenres()
			.then(setGenres)
			.catch(() => setGenres([]));
	}, []);

	useEffect(() => {
		let current = true;
		setError("");
		setResult(null);
		listGames({ genre, q, limit: pageSize, offset: (page - 1) * pageSize })
			.then((games) => current && setResult(games))
			.catch(() => current && setError("Could not load games."));
		return () => {
			current = false;
		};
	}, [genre, q, page]);

	const pages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;
	const goToPage = (next: number) =>
		navigate({
			search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }),
		});

	return (
		<main className="w-5xl p-8">
			<h1 className="text-4xl font-bold">Linux games</h1>
			<div className="mt-6 flex flex-wrap items-end gap-4 w-full">
				<GenreFilter
					genres={genres}
					value={genre}
					onChange={(next) =>
						navigate({
							search: (prev) => ({ ...prev, genre: next, page: undefined }),
						})
					}
				/>
				<form
					className="flex items-end gap-2 grow-1"
					onSubmit={(event) => {
						event.preventDefault();
						navigate({
							search: (prev) => ({
								...prev,
								q: query.trim() || undefined,
								page: undefined,
							}),
						});
					}}
				>
					<label className="block w-full">
						Search
						<input
							className="block border p-2 w-full"
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</label>
					<button className="border px-4 py-2" type="submit">
						Search
					</button>
				</form>
			</div>

			<section className="mt-6">
				{error ? (
					<p role="alert">{error}</p>
				) : result === null ? (
					<p>Loading games…</p>
				) : (
					<>
						<p className="mb-2 text-sm text-gray-600">
							{result.total} {result.total === 1 ? "game" : "games"}
						</p>
						<GameList games={result.items} empty="No games match." />
						{pages > 1 && (
							<nav className="mt-4 flex items-center gap-4" aria-label="Pages">
								<button
									className="border px-4 py-2"
									type="button"
									disabled={page <= 1}
									onClick={() => goToPage(page - 1)}
								>
									Previous
								</button>
								<span>
									Page {page} of {pages}
								</span>
								<button
									className="border px-4 py-2"
									type="button"
									disabled={page >= pages}
									onClick={() => goToPage(page + 1)}
								>
									Next
								</button>
							</nav>
						)}
					</>
				)}
			</section>
		</main>
	);
}
