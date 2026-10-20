import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "PenguinLog",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="flex flex-col items-center">
				<header className="sticky top-0 z-50 flex flex-wrap justify-around gap-6 border-b px-8 py-4 w-full shadow-xl !rounded-none">
					<Link className="font-bold text-xl" to="/">
						PenguinLog
					</Link>
					<nav className="flex" aria-label="Main">
					<Link to="/games" className="btn-header px-3">Games</Link>
					<Link to="/app" className="btn-header px-3">My page</Link>
					<Link to="/auth" className="btn-header px-3">Account</Link>
					</nav>
				</header>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
