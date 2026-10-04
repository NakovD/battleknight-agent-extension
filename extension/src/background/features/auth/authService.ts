import type {
	IAuthApiClient,
	IssuedToken,
} from "@/background/features/auth/models/authApiClient";
import type { IAuthSessionStore } from "@/background/features/auth/models/authSessionStore";
import type {
	Account,
	AuthSession,
	LoginCredentials,
	RegisterCredentials,
} from "@/common/features/auth/validators/authValidators";

const signedOut: Account = { status: "signedOut" };

export class AuthService {
	constructor(
		private readonly api: IAuthApiClient,
		private readonly sessions: IAuthSessionStore,
		private readonly now: () => Date = () => new Date(),
	) {}

	async register(credentials: RegisterCredentials): Promise<Account> {
		return this.startSession(
			credentials.email,
			await this.api.register(credentials),
		);
	}

	async login(credentials: LoginCredentials): Promise<Account> {
		return this.startSession(credentials.email, await this.api.login(credentials));
	}

	async logout(): Promise<Account> {
		await this.sessions.clear();
		return signedOut;
	}

	async getAccount(): Promise<Account> {
		const session = await this.sessions.get();

		if (!session) {
			return signedOut;
		}

		// There are no refresh tokens yet, so an expired session simply ends.
		if (new Date(session.expiresAt).getTime() <= this.now().getTime()) {
			await this.sessions.clear();
			return signedOut;
		}

		return toAccount(session);
	}

	private async startSession(email: string, token: IssuedToken) {
		const session: AuthSession = {
			accessToken: token.accessToken,
			expiresAt: token.expiresAt,
			// The API stores emails trimmed and lowercased; show the same form.
			email: email.trim().toLowerCase(),
		};

		await this.sessions.save(session);

		return toAccount(session);
	}
}

const toAccount = (session: AuthSession): Account => ({
	status: "signedIn",
	email: session.email,
	expiresAt: session.expiresAt,
});
