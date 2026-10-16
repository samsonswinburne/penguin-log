import { createFileRoute } from "@tanstack/react-router";
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
		<main className="p-8">
			<h1 className="text-4xl font-bold">PenguinLog</h1>
			<p className="mt-4">Backend status: {status}</p>
		</main>
	);
}
