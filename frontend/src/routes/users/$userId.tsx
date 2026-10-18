import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameList } from "../../components/GameList";
import { ReviewList } from "../../components/ReviewList";
import { getProfile, type Profile } from "../../lib/api";

export const Route = createFileRoute("/users/$userId")({
	component: ProfilePage,
});

function ProfilePage() {
	const userId = Number(Route.useParams().userId);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		setError("");
		getProfile(userId)
			.then(setProfile)
			.catch(() => setError("User not found."));
	}, [userId]);

	if (error) return <main className="p-8">{error}</main>;
	if (profile === null) return <main className="p-8">Loading…</main>;

	return (
		<main className="max-w-3xl p-8">
			<h1 className="text-4xl font-bold">{profile.display_name}</h1>
			{profile.bio && <p className="mt-4 whitespace-pre-line">{profile.bio}</p>}

			<section className="mt-8">
				<h2 className="mb-4 text-2xl font-bold">Favourite games</h2>
				<GameList games={profile.favourites} empty="No favourites yet." />
			</section>
			<section className="mt-8">
				<h2 className="mb-4 text-2xl font-bold">Want to play</h2>
				<GameList games={profile.backlog} empty="Nothing in the backlog." />
			</section>
			<section className="mt-8">
				<h2 className="mb-4 text-2xl font-bold">Reviews</h2>
				<ReviewList reviews={profile.reviews} label="game" />
			</section>
		</main>
	);
}
