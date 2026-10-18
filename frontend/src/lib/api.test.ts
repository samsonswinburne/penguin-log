import { afterEach, expect, test, vi } from "vitest";
import {
	ApiError,
	createReview,
	deleteReview,
	listGames,
	releaseYear,
	setInList,
	updateProfile,
} from "./api";
import { clearToken, saveToken } from "./token";

afterEach(() => {
	clearToken();
	vi.unstubAllGlobals();
});

function stubFetch(response: Partial<Response> = {}) {
	const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
		ok: true,
		status: 200,
		json: async () => ({}),
		...response,
	}));
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

function headersOf(fetchMock: ReturnType<typeof stubFetch>) {
	return new Headers(fetchMock.mock.calls[0][1]?.headers);
}

test("listGames only sends the filters that are set", async () => {
	const fetchMock = stubFetch({
		json: async () => ({ items: [], total: 0 }),
	});

	await listGames();
	await listGames({ genre: 8, q: "hollow knight", limit: 25, offset: 50 });
	await listGames({ offset: 0 });

	expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
		"/api/games",
		"/api/games?genre=8&q=hollow+knight&limit=25&offset=50",
		"/api/games",
	]);
});

test("requests send the stored token", async () => {
	saveToken("abc");
	const fetchMock = stubFetch();

	await listGames();

	expect(headersOf(fetchMock).get("Authorization")).toBe("Bearer abc");
});

test("anonymous requests have no Authorization header", async () => {
	const fetchMock = stubFetch();

	await listGames();

	expect(headersOf(fetchMock).has("Authorization")).toBe(false);
});

test("createReview posts JSON", async () => {
	const fetchMock = stubFetch({ status: 201 });

	await createReview(5, 9, "Great");

	const [url, init] = fetchMock.mock.calls[0];
	expect(url).toBe("/api/reviews");
	expect(init?.method).toBe("POST");
	expect(init?.body).toBe(
		JSON.stringify({ game_id: 5, rating: 9, comment: "Great" }),
	);
	expect(headersOf(fetchMock).get("Content-Type")).toBe("application/json");
});

test("updateProfile sends the display name and bio", async () => {
	const fetchMock = stubFetch();

	await updateProfile("Tux", "Hello");

	const [url, init] = fetchMock.mock.calls[0];
	expect(url).toBe("/api/me/profile");
	expect(init?.method).toBe("PUT");
	expect(init?.body).toBe(
		JSON.stringify({ display_name: "Tux", bio: "Hello" }),
	);
});

test("empty responses resolve to undefined", async () => {
	const json = vi.fn();
	const fetchMock = stubFetch({ status: 204, json });

	await expect(deleteReview(3)).resolves.toBeUndefined();
	expect(fetchMock.mock.calls[0]).toEqual([
		"/api/reviews/3",
		expect.objectContaining({ method: "DELETE" }),
	]);
	expect(json).not.toHaveBeenCalled();
});

test("setInList adds with PUT and removes with DELETE", async () => {
	const fetchMock = stubFetch({ status: 204 });

	await setInList("backlog", 7, true);
	await setInList("favourites", 7, false);

	expect(
		fetchMock.mock.calls.map(([url, init]) => [init?.method, url]),
	).toEqual([
		["PUT", "/api/me/backlog/7"],
		["DELETE", "/api/me/favourites/7"],
	]);
});

test("errors carry the status and the API's message", async () => {
	stubFetch({
		ok: false,
		status: 409,
		json: async () => ({ detail: "You have already reviewed this game" }),
	});

	const error = await createReview(1, 5, "Again").catch((e: unknown) => e);

	expect(error).toBeInstanceOf(ApiError);
	expect((error as ApiError).status).toBe(409);
	expect((error as ApiError).message).toBe(
		"You have already reviewed this game",
	);
});

test("errors without a readable message fall back to a generic one", async () => {
	stubFetch({
		ok: false,
		status: 500,
		json: async () => {
			throw new Error("not JSON");
		},
	});

	await expect(listGames()).rejects.toThrow("Something went wrong.");
});

test("releaseYear shows the year or TBA", () => {
	const game = { id: 1, name: "Celeste", slug: "celeste", genres: [] };
	expect(releaseYear({ ...game, release_date: "2018-01-26" })).toBe("2018");
	expect(releaseYear({ ...game, release_date: null })).toBe("TBA");
});
