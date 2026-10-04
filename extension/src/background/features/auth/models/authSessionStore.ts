import type { AuthSession } from "@/common/features/auth/validators/authValidators";

export interface IAuthSessionStore {
	/** The stored session, or null when there is none or it can't be read. */
	get(): Promise<AuthSession | null>;
	save(session: AuthSession): Promise<void>;
	clear(): Promise<void>;
}
