import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ReviewForm } from "./ReviewForm";

afterEach(cleanup);

test("submits the chosen rating and trimmed comment", async () => {
	const onSubmit = vi.fn(async () => {});
	render(<ReviewForm submitLabel="Post review" onSubmit={onSubmit} />);

	fireEvent.change(screen.getByLabelText("Rating"), {
		target: { value: "6" },
	});
	fireEvent.change(screen.getByLabelText("Comment"), {
		target: { value: "  Fun co-op  " },
	});
	fireEvent.click(screen.getByRole("button", { name: "Post review" }));

	await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(6, "Fun co-op"));
	expect(screen.queryByRole("button", { name: "Delete review" })).toBeNull();
});

test("needs a comment before submitting", () => {
	const onSubmit = vi.fn(async () => {});
	render(<ReviewForm submitLabel="Post review" onSubmit={onSubmit} />);

	fireEvent.change(screen.getByLabelText("Comment"), {
		target: { value: "   " },
	});
	fireEvent.click(screen.getByRole("button", { name: "Post review" }));

	expect(screen.getByRole("alert").textContent).toBe(
		"Write a comment for your review.",
	);
	expect(onSubmit).not.toHaveBeenCalled();
});

test("starts from an existing review and can delete it", async () => {
	const onDelete = vi.fn(async () => {});
	render(
		<ReviewForm
			initial={{ rating: 3, comment: "Not for me" }}
			submitLabel="Save review"
			onSubmit={vi.fn(async () => {})}
			onDelete={onDelete}
		/>,
	);

	expect((screen.getByLabelText("Rating") as HTMLSelectElement).value).toBe(
		"3",
	);
	expect((screen.getByLabelText("Comment") as HTMLTextAreaElement).value).toBe(
		"Not for me",
	);

	fireEvent.click(screen.getByRole("button", { name: "Delete review" }));
	await waitFor(() => expect(onDelete).toHaveBeenCalled());
});

test("shows the error when saving fails", async () => {
	const onSubmit = vi.fn(async () => {
		throw new Error("You have already reviewed this game");
	});
	render(<ReviewForm submitLabel="Post review" onSubmit={onSubmit} />);

	fireEvent.change(screen.getByLabelText("Comment"), {
		target: { value: "Again" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Post review" }));

	expect((await screen.findByRole("alert")).textContent).toBe(
		"You have already reviewed this game",
	);
	expect(
		(screen.getByRole("button", { name: "Post review" }) as HTMLButtonElement)
			.disabled,
	).toBe(false);
});
