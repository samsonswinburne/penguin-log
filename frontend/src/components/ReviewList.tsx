import { Link } from "@tanstack/react-router";
import type { Review } from "../lib/api";

// On a game page each review is labelled with its author, on a profile with its game.
export function ReviewList({
	reviews,
	label,
}: {
	reviews: Review[];
	label: "author" | "game";
}) {
	if (reviews.length === 0)
		return <p className="text-gray-600">No reviews yet.</p>;

	return (
		<ul className="space-y-4">
			{reviews.map((review) => (
				<li key={review.id} className="border p-4">
					<div className="flex justify-between gap-4">
						{label === "author" ? (
							<Link
								className="font-semibold underline"
								to="/users/$userId"
								params={{ userId: String(review.user.id) }}
							>
								{review.user.display_name}
							</Link>
						) : (
							<Link
								className="font-semibold underline"
								to="/games/$gameId"
								params={{ gameId: String(review.game.id) }}
							>
								{review.game.name}
							</Link>
						)}
						<span>{review.rating} / 10</span>
					</div>
					<p className="mt-2 whitespace-pre-line">{review.comment}</p>
				</li>
			))}
		</ul>
	);
}
