import { Link } from "@tanstack/react-router";
import { type GameSummary, releaseYear } from "../lib/api";

export function GameList({
	games,
	empty,
}: {
	games: GameSummary[];
	empty: string;
}) {
	if (games.length === 0) return <p className="text-gray-600">{empty}</p>;

	return (
		<ul className="divide-y border-y">
			{games.map((game) => (
				<li key={game.id} className="py-2">
					<Link
						className="font-semibold underline"
						to="/games/$gameId"
						params={{ gameId: String(game.id) }}
					>
						{game.name}
					</Link>
					<span className="ml-2 text-sm text-gray-600">
						{releaseYear(game)}
						{game.genres.length > 0 &&
							` · ${game.genres.map((genre) => genre.name).join(", ")}`}
					</span>
				</li>
			))}
		</ul>
	);
}
