import { redirect } from '@sveltejs/kit';
import { cerrarSesion } from '@vienna/db';
import { COOKIE } from '$lib/server/sesion';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (locals.token) await cerrarSesion(locals.token);
	cookies.delete(COOKIE, { path: '/' });
	redirect(303, '/');
};
