import { redirect } from '@sveltejs/kit';

export const COOKIE = 'vienna_sesion';

export function opcionesCookie(url: URL) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 14
	};
}

export function exigir(locals: App.Locals) {
	if (!locals.usuario || !locals.fraccionamiento) redirect(303, '/');
	return {
		usuario: locals.usuario,
		fraccionamiento: locals.fraccionamiento,
		roles: locals.roles,
		membresias: locals.membresias,
		token: locals.token
	};
}
