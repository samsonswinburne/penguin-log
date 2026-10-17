import type { User } from "../lib/auth";
import { AuthForm } from "./AuthForm";

export function LoginForm({
	onAuthenticated,
}: {
	onAuthenticated: (user: User) => void;
}) {
	return <AuthForm mode="login" onAuthenticated={onAuthenticated} />;
}
