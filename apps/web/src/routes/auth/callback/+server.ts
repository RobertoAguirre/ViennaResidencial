import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const aviso = url.searchParams.get('error_description');
	if (aviso) redirect(303, `/?aviso=${encodeURIComponent(aviso)}`);
	if (!locals.supabase) redirect(303, '/');

	const codigo = url.searchParams.get('code');
	if (!codigo) redirect(303, '/?aviso=Google%20no%20devolvi%C3%B3%20el%20acceso.');

	const { error } = await locals.supabase.auth.exchangeCodeForSession(codigo);
	if (error) redirect(303, `/?aviso=${encodeURIComponent(error.message)}`);
	redirect(303, '/panel');
};
