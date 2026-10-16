import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Home } from "./index";

test("home page shows its heading", () => {
	render(<Home />);

	expect(screen.getByRole("heading", { name: "PenguinLog" })).toBeTruthy();
});
