import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProfileForm } from "../components/ProfileForm";
import { getProfile, type Profile } from "../lib/api";
import { restoreUser } from "../lib/auth";

export const Route = createFileRoute("/app")({ component: AppPage });

function AppPage() {
	const [profile, setProfile] = useState<Profile | null>(null);

	useEffect(() => {
		void restoreUser().then(async (user) => {
			if (user === null) {
				window.location.replace("/auth");
				return;
			}
			setProfile(await getProfile(user.id));
		});
	}, []);

	if (profile === null) return null;
	return (
		<main className="max-w-xl p-8">
			<h1 className="text-4xl font-bold">My PenguinLog</h1>
			<p className="mt-4">
				<Link
					className="underline"
					to="/users/$userId"
					params={{ userId: String(profile.id) }}
				>
					View my public profile
				</Link>
				{" · "}
				<Link className="underline" to="/games">
					Find games to review
				</Link>
			</p>
			<section className="mt-8">
				<h2 className="mb-4 text-2xl font-bold">Edit profile</h2>
				<ProfileForm displayName={profile.display_name} bio={profile.bio} />
			</section>
		</main>
	);
}
