import { useState } from "react";

const ratings = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

type ReviewFormProps = {
	initial?: { rating: number; comment: string };
	submitLabel: string;
	onSubmit: (rating: number, comment: string) => Promise<void>;
	onDelete?: () => Promise<void>;
};

export function ReviewForm({
	initial,
	submitLabel,
	onSubmit,
	onDelete,
}: ReviewFormProps) {
	const [rating, setRating] = useState(initial?.rating ?? 8);
	const [comment, setComment] = useState(initial?.comment ?? "");
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);

	async function run(action: () => Promise<void>) {
		setBusy(true);
		setMessage("");
		try {
			await action();
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Something went wrong.",
			);
		} finally {
			setBusy(false);
		}
	}

	function submit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!comment.trim()) {
			setMessage("Write a comment for your review.");
			return;
		}
		void run(() => onSubmit(rating, comment.trim()));
	}

	return (
		<form className="space-y-4" onSubmit={submit}>
			<label className="block">
				<p className="mb-2 ml-1 font-semibold">Rating</p>
				<select
					className="block border p-2"
					value={rating}
					onChange={(event) => setRating(Number(event.target.value))}
				>
					{ratings.map((value) => (
						<option key={value} value={value}>
							{value} / 10
						</option>
					))}
				</select>
			</label>
			<label className="block">
				<p className="mb-1.5 ml-1 font-semibold">Comment</p>
				<textarea
					className="block w-full border p-2"
					rows={4}
					maxLength={5000}
					value={comment}
					onChange={(event) => setComment(event.target.value)}
				/>
			</label>
			<div className="flex gap-4">
				<button
					className="btn-primary border px-4 py-2"
					type="submit"
					disabled={busy}
				>
					{submitLabel}
				</button>
				{onDelete && (
					<button
						className="btn-danger border px-4 py-2"
						type="button"
						disabled={busy}
						onClick={() => void run(onDelete)}
					>
						Delete review
					</button>
				)}
			</div>
			{message && <p role="alert">{message}</p>}
		</form>
	);
}
