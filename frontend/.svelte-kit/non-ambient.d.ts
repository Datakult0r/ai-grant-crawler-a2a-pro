
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
		RouteId(): "/" | "/admin" | "/admin/sources" | "/alerts" | "/analytics" | "/documents" | "/jules" | "/landing" | "/login" | "/matcher" | "/predictor" | "/settings" | "/signup" | "/team" | "/thinktank" | "/thinktank/[grantId]" | "/tracker" | "/writer" | "/writer/[grantId]";
		RouteParams(): {
			"/thinktank/[grantId]": { grantId: string };
			"/writer/[grantId]": { grantId: string }
		};
		LayoutParams(): {
			"/": { grantId?: string };
			"/admin": Record<string, never>;
			"/admin/sources": Record<string, never>;
			"/alerts": Record<string, never>;
			"/analytics": Record<string, never>;
			"/documents": Record<string, never>;
			"/jules": Record<string, never>;
			"/landing": Record<string, never>;
			"/login": Record<string, never>;
			"/matcher": Record<string, never>;
			"/predictor": Record<string, never>;
			"/settings": Record<string, never>;
			"/signup": Record<string, never>;
			"/team": Record<string, never>;
			"/thinktank": { grantId?: string };
			"/thinktank/[grantId]": { grantId: string };
			"/tracker": Record<string, never>;
			"/writer": { grantId?: string };
			"/writer/[grantId]": { grantId: string }
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/admin/sources" | "/admin/sources/" | "/alerts" | "/alerts/" | "/analytics" | "/analytics/" | "/documents" | "/documents/" | "/jules" | "/jules/" | "/landing" | "/landing/" | "/login" | "/login/" | "/matcher" | "/matcher/" | "/predictor" | "/predictor/" | "/settings" | "/settings/" | "/signup" | "/signup/" | "/team" | "/team/" | "/thinktank" | "/thinktank/" | `/thinktank/${string}` & {} | `/thinktank/${string}/` & {} | "/tracker" | "/tracker/" | "/writer" | "/writer/" | `/writer/${string}` & {} | `/writer/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/assets/lab/breadcrumb.jpg" | "/assets/lab/LabNPCs.png" | "/assets/lab/tiles/spriteSheet_fireEffect03_42x52.png" | "/assets/lab/tiles/spriteSheet_lightBulbSmallAnimation_32x32.png" | "/assets/lab/tiles/spriteSheet_lightingBulb02_136x146.png" | "/assets/lab/tiles/spriteSheet_tiledLiquids_32x32.png" | "/assets/lab/tiles/tilesFloor32.png" | "/assets/lab/tiles/tilesStuff.png" | "/assets/lab/tiles/tilesWalls.png" | "/assets/lab-tileset/assets.png" | "/assets/lab-tileset/creaturesTubes.gif" | "/assets/lab-tileset/creaturesTubesSpriteSheet.png" | "/assets/lab-tileset/creatures_organization.png" | "/assets/lab-tileset/examples_map_final.png" | "/assets/lab-tileset/floorsWalls.png" | "/assets/lab-tileset/LabNPCs.png" | "/assets/lab-tileset/Tubes.png" | "/favicon.png" | "/manifest.json" | string & {};
	}
}