import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	if (!locals.supabase) error(404, 'Google no está configurado en este servidor.');
	const { data, error: fallo } = await locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo: `${url.origin}/auth/callback` }
	});
	if (fallo || !data.url) error(500, fallo?.message ?? 'No se pudo abrir Google.');
	redirect(303, data.url);
};
