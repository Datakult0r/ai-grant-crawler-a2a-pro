
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
		RouteId(): "/" | "/alerts" | "/documents" | "/matcher" | "/predictor" | "/team" | "/thinktank" | "/tracker" | "/writer";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/alerts": Record<string, never>;
			"/documents": Record<string, never>;
			"/matcher": Record<string, never>;
			"/predictor": Record<string, never>;
			"/team": Record<string, never>;
			"/thinktank": Record<string, never>;
			"/tracker": Record<string, never>;
			"/writer": Record<string, never>
		};
		Pathname(): "/" | "/alerts" | "/alerts/" | "/documents" | "/documents/" | "/matcher" | "/matcher/" | "/predictor" | "/predictor/" | "/team" | "/team/" | "/thinktank" | "/thinktank/" | "/tracker" | "/tracker/" | "/writer" | "/writer/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | "/manifest.json" | string & {};
	}
}