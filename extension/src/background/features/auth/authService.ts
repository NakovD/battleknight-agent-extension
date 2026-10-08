import type { IAccessTokenProvider } from "@/background/features/auth/models/accessTokenProvider";
import type {
	IAuthApiClient,
	IssuedToken,
} from "@/background/features/auth/models/authApiClient";
import type { IAuthSessionStore } from "@/background/features/auth/models/authSessionStore";
import { UnauthorizedApiError } from "@/background/models/apiError";
import type {
	Account,
	AuthSession,
	LoginCredentials,
	RegisterCredentials,
} from "@/common/features/auth/validators/authValidators";

const signedOut: Account = { status: "signedOut" };

/**
 * Renew this long before the access token runs out, so a request that is about
 * to be sent doesn't arrive just after the token died.
 */
const renewalMarginMs = 30_000;

export class AuthService implements IAccessTokenProvider {
	/**
	 * The refresh in flight, if any. The API rotates the refresh token on every
	 * call and treats a second use of the old one as a leak — it revokes the
	 * whole chain. Two callers refreshing at once would do exactly that, so they
	 * share one call instead.
	 */
	private renewal: Promise<AuthSession | null> | null = null;

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
		return this.startSession(
			credentials.email,
			await this.api.login(credentials),
		);
	}

	async logout(): Promise<Account> {
		const session = await this.sessions.get();

		if (session) {
			try {
				await this.api.logout(session.refreshToken);
			} catch {
				// Signing out locally has to work even with no server to tell. The
				// token then lives out its 30 days unused, which is why it is short
				// enough to matter.
			}
		}

		await this.sessions.clear();

		return signedOut;
	}

	async getAccount(): Promise<Account> {
		const session = await this.sessions.get();

		if (!session) {
			return signedOut;
		}

		// The access token's own expiry says nothing about being signed in — it is
		// renewed on demand. The session ends when the refresh token does.
		if (this.hasPassed(session.refreshTokenExpiresAt)) {
			await this.sessions.clear();
			return signedOut;
		}

		return toAccount(session);
	}

	async getAccessToken(): Promise<string | null> {
		const session = await this.sessions.get();

		if (!session) {
			return null;
		}

		if (!this.hasPassed(session.expiresAt, renewalMarginMs)) {
			return session.accessToken;
		}

		return (await this.renew(session))?.accessToken ?? null;
	}

	async refreshAccessToken(): Promise<string | null> {
		const session = await this.sessions.get();

		return session ? ((await this.renew(session))?.accessToken ?? null) : null;
	}

	private renew(session: AuthSession): Promise<AuthSession | null> {
		this.renewal ??= this.exchange(session).finally(() => {
			this.renewal = null;
		});

		return this.renewal;
	}

	private async exchange(session: AuthSession): Promise<AuthSession | null> {
		let issued: IssuedToken;

		try {
			issued = await this.api.refresh(session.refreshToken);
		} catch (error) {
			// Rejected: the token expired, was revoked, or was already used. Either
			// way there is nothing left to renew.
			if (error instanceof UnauthorizedApiError) {
				await this.sessions.clear();
				return null;
			}

			// A network failure says nothing about the token, so the session stays
			// and the caller can try again.
			throw error;
		}

		return this.save(session.email, issued);
	}

	private async startSession(email: string, token: IssuedToken) {
		// The API stores emails trimmed and lowercased; show the same form.
		return toAccount(await this.save(email.trim().toLowerCase(), token));
	}

	private async save(email: string, token: IssuedToken): Promise<AuthSession> {
		const session: AuthSession = { ...token, email };

		await this.sessions.save(session);

		return session;
	}

	private hasPassed(instant: string, marginMs = 0) {
		return new Date(instant).getTime() - marginMs <= this.now().getTime();
	}
}

const toAccount = (session: AuthSession): Account => ({
	status: "signedIn",
	email: session.email,
	expiresAt: session.refreshTokenExpiresAt,
});
