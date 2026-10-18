import { getToken } from "./token";

export type Genre = { id: number; name: string };

export type GameSummary = {
	id: number;
	name: string;
	slug: string;
	release_date: string | null;
	genres: Genre[];
};

export type Review = {
	id: number;
	rating: number;
	comment: string;
	created_at: string;
	updated_at: string;
	game: { id: number; name: string };
	user: { id: number; display_name: string };
};

export type GameDetail = GameSummary & {
	summary: string;
	igdb_url: string;
	average_rating: number | null;
	review_count: number;
	reviews: Review[];
};

export type GamePage = { items: GameSummary[]; total: number };

export type GameState = {
	review: Review | null;
	favourite: boolean;
	backlog: boolean;
};

export type Profile = {
	id: number;
	display_name: string;
	bio: string;
	reviews: Review[];
	favourites: GameSummary[];
	backlog: GameSummary[];
};

export type GameList = "favourites" | "backlog";

export class ApiError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	if (init.body) headers.set("Content-Type", "application/json");
	const token = getToken();
	if (token) headers.set("Authorization", `Bearer ${token}`);

	const response = await fetch(path, { ...init, headers });
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		const detail =
			typeof body?.detail === "string" ? body.detail : "Something went wrong.";
		throw new ApiError(response.status, detail);
	}
	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
}

export function listGenres() {
	return request<Genre[]>("/api/genres");
}

export function listGames({
	genre,
	q,
	limit,
	offset,
}: {
	genre?: number;
	q?: string;
	limit?: number;
	offset?: number;
} = {}) {
	const params = new URLSearchParams();
	if (genre !== undefined) params.set("genre", String(genre));
	if (q) params.set("q", q);
	if (limit !== undefined) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	const query = params.toString();
	return request<GamePage>(`/api/games${query ? `?${query}` : ""}`);
}

export function getGame(gameId: number) {
	return request<GameDetail>(`/api/games/${gameId}`);
}

export function getGameState(gameId: number) {
	return request<GameState>(`/api/me/games/${gameId}`);
}

export function createReview(gameId: number, rating: number, comment: string) {
	return request<Review>("/api/reviews", {
		method: "POST",
		body: JSON.stringify({ game_id: gameId, rating, comment }),
	});
}

export function updateReview(
	reviewId: number,
	rating: number,
	comment: string,
) {
	return request<Review>(`/api/reviews/${reviewId}`, {
		method: "PUT",
		body: JSON.stringify({ rating, comment }),
	});
}

export function deleteReview(reviewId: number) {
	return request<void>(`/api/reviews/${reviewId}`, { method: "DELETE" });
}

export function getProfile(userId: number) {
	return request<Profile>(`/api/users/${userId}`);
}

export function updateProfile(displayName: string, bio: string) {
	return request<{ id: number; display_name: string; bio: string }>(
		"/api/me/profile",
		{
			method: "PUT",
			body: JSON.stringify({ display_name: displayName, bio }),
		},
	);
}

export function setInList(list: GameList, gameId: number, included: boolean) {
	return request<void>(`/api/me/${list}/${gameId}`, {
		method: included ? "PUT" : "DELETE",
	});
}

export function releaseYear(game: GameSummary): string {
	return game.release_date ? game.release_date.slice(0, 4) : "TBA";
}
