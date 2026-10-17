import type { User } from "../lib/auth";
import { AuthForm } from "./AuthForm";

export function SignupForm({
	onAuthenticated,
}: {
	onAuthenticated: (user: User) => void;
}) {
	return <AuthForm mode="signup" onAuthenticated={onAuthenticated} />;
}
