import { leerSesion } from '@vienna/db';
import type { Handle } from '@sveltejs/kit';
import { COOKIE } from '$lib/server/sesion';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.token = event.cookies.get(COOKIE) ?? null;
	event.locals.usuario = null;
	event.locals.fraccionamiento = null;
	event.locals.roles = [];
	event.locals.membresias = [];

	if (event.locals.token) {
		const sesion = await leerSesion(event.locals.token);
		if (sesion) {
			event.locals.usuario = sesion.usuario;
			event.locals.fraccionamiento = sesion.fraccionamiento;
			event.locals.roles = sesion.roles;
			event.locals.membresias = sesion.membresias;
		} else {
			event.cookies.delete(COOKIE, { path: '/' });
			event.locals.token = null;
		}
	}

	return resolve(event);
};
