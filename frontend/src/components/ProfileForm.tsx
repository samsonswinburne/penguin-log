import { useState } from "react";
import { updateProfile } from "../lib/api";

export function ProfileForm({
	displayName: initialName,
	bio: initialBio,
}: {
	displayName: string;
	bio: string;
}) {
	const [displayName, setDisplayName] = useState(initialName);
	const [bio, setBio] = useState(initialBio);
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);

	async function submit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setMessage("");
		try {
			const saved = await updateProfile(displayName, bio);
			setDisplayName(saved.display_name);
			setBio(saved.bio);
			setMessage("Profile saved.");
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Something went wrong.",
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<form className="space-y-4 w-lg" onSubmit={(event) => void submit(event)}>
			<label className="block w-full">
				<p className="pb-2 font-semibold">Display name</p>
				<input
					className="block w-full border p-2"
					value={displayName}
					onChange={(event) => setDisplayName(event.target.value)}
					maxLength={50}
					required
				/>
			</label>
			<label className="block w-full">
				<p className="pb-2 font-semibold">Bio</p>
				<textarea
					className="block w-full border p-2"
					rows={4}
					value={bio}
					onChange={(event) => setBio(event.target.value)}
					maxLength={1000}
				/>
			</label>
			<button
				className="btn-primary border w-full px-4 py-2 mt-2"
				type="submit"
				disabled={busy}
			>
				Save profile
			</button>
			{message && <p aria-live="polite">{message}</p>}
		</form>
	);
}
