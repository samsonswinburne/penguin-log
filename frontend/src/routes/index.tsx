import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

export function Home() {
	const [status, setStatus] = useState("Checking backend…");

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
			<h1 className="text-4xl font-bold">PenguinLog</h1>
			<p className="mt-4 text-lg">
				Rate, review and keep a backlog of the games you play on Linux.
			</p>
			<p className="mt-8 flex gap-6">
				<Link className="underline" to="/games">
					Browse games
				</Link>
				<Link className="underline" to="/auth">
					Log in or sign up
				</Link>
			</p>
			<p className="text-sm text-gray-600 m-auto mb-0">Backend status: {status}</p>
		</main>
	);
}
