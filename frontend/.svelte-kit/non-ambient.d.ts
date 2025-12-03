
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/alerts" | "/documents" | "/jules" | "/matcher" | "/predictor" | "/team" | "/thinktank" | "/thinktank/[grantId]" | "/tracker" | "/writer" | "/writer/[grantId]";
		RouteParams(): {
			"/thinktank/[grantId]": { grantId: string };
			"/writer/[grantId]": { grantId: string }
		};
		LayoutParams(): {
			"/": { grantId?: string };
			"/alerts": Record<string, never>;
			"/documents": Record<string, never>;
			"/jules": Record<string, never>;
			"/matcher": Record<string, never>;
			"/predictor": Record<string, never>;
			"/team": Record<string, never>;
			"/thinktank": { grantId?: string };
			"/thinktank/[grantId]": { grantId: string };
			"/tracker": Record<string, never>;
			"/writer": { grantId?: string };
			"/writer/[grantId]": { grantId: string }
		};
		Pathname(): "/" | "/alerts" | "/alerts/" | "/documents" | "/documents/" | "/jules" | "/jules/" | "/matcher" | "/matcher/" | "/predictor" | "/predictor/" | "/team" | "/team/" | "/thinktank" | "/thinktank/" | `/thinktank/${string}` & {} | `/thinktank/${string}/` & {} | "/tracker" | "/tracker/" | "/writer" | "/writer/" | `/writer/${string}` & {} | `/writer/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | "/manifest.json" | string & {};
	}
}