import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { RequestEvent } from '@sveltejs/kit';

export function googleConfigurado() {
	return Boolean(env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY);
}

export function crearClienteSupabase(event: RequestEvent) {
	const url = env.PUBLIC_SUPABASE_URL;
	const llave = env.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !llave) return null;

	return createServerClient(url, llave, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookies) {
				for (const { name, value, options } of cookies) {
					event.cookies.set(name, value, {
						...(options as CookieOptions),
						path: '/',
						secure: event.url.protocol === 'https:'
					});
				}
			}
		}
	});
}
