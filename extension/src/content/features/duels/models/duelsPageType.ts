export type DuelsPageType =
	| "ranking-unfiltered" // току що заредихме /highscore/ — трябва да submit-нем формата
	| "ranking-ready" // формата е submit-ната, таблицата е с правилните данни
	| "duel-result" // страницата след дуел
	| "unknown";
