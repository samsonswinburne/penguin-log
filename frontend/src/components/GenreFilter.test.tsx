import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { GenreFilter } from "./GenreFilter";

afterEach(cleanup);

const genres = [
	{ id: 31, name: "Adventure" },
	{ id: 32, name: "Indie" },
];

test("lists every genre after an All genres option", () => {
	render(<GenreFilter genres={genres} value={32} onChange={vi.fn()} />);

	const select = screen.getByLabelText("Genre") as HTMLSelectElement;
	expect([...select.options].map((option) => option.text)).toEqual([
		"All genres",
		"Adventure",
		"Indie",
	]);
	expect(select.value).toBe("32");
});

test("reports the chosen genre id, or undefined for all genres", () => {
	const onChange = vi.fn();
	render(<GenreFilter genres={genres} value={undefined} onChange={onChange} />);

	fireEvent.change(screen.getByLabelText("Genre"), {
		target: { value: "31" },
	});
	fireEvent.change(screen.getByLabelText("Genre"), { target: { value: "" } });

	expect(onChange.mock.calls).toEqual([[31], [undefined]]);
});
