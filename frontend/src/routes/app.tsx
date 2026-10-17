import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hasToken } from "../lib/token";

export const Route = createFileRoute("/app")({ component: AppPage });

function AppPage() {
	const [allowed, setAllowed] = useState(false);

	useEffect(() => {
		if (hasToken()) {
			setAllowed(true);
		} else {
			window.location.replace("/auth");
		}
	}, []);

	if (!allowed) return null;
	return <div>Hello "/app"!</div>;
}
