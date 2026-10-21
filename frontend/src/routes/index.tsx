import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { restoreUser, type User } from "../lib/auth";

export const Route = createFileRoute("/")({ component: Home });

export function Home() {
	const [user, setUser] = useState<User | null>(null);
	const [status, setStatus] = useState("Checking backend…");

	useEffect(() => {
		void restoreUser().then(setUser);
	}, []);
	
	useEffect(() => {
		fetch("/api/health")
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json();
			})
			.then((data) => setStatus(data.status))
			.catch(() => setStatus("Backend unavailable"));
	}, []);

	return (
		<main className="flex flex-col p-8 w-5xl grow-1">
			<h1 className="text-4xl font-bold mt-4 mb-3">PenguinLog</h1>
			<p className="mt-4 text-lg">
				Rate, review and keep a backlog of the games you play on Linux.
			</p>
			<p className="mt-8 flex flex-col gap-2">
				<Link className="underline" to="/games">
					Browse games
				</Link>
				{!user && (<Link className="underline" to="/auth">
					Log in or sign up
				</Link>)
				}
			</p>
			<p className="text-sm text-gray-600 m-auto mb-0">Backend status: {status}</p>
		</main>
	);
}
