import { fail, redirect } from '@sveltejs/kit';
import { crearSesion, listarCuentasDemo, membresiasDe, validarCredenciales } from '@vienna/db';
import { COOKIE, opcionesCookie } from '$lib/server/sesion';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.usuario) redirect(303, '/panel');
	return { demo: await listarCuentasDemo() };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const datos = await request.formData();
		const correo = String(datos.get('correo') ?? '').trim().toLowerCase();
		const password = String(datos.get('password') ?? '');
		const usuario = await validarCredenciales(correo, password);
		if (!usuario) return fail(400, { correo, error: 'Correo o contraseña incorrectos.' });

		const membresias = await membresiasDe(usuario.id);
		if (membresias.length === 0) {
			return fail(400, { correo, error: 'Esta cuenta no está en ningún fraccionamiento.' });
		}

		const token = await crearSesion(usuario.id, membresias[0].fraccionamientoId);
		cookies.set(COOKIE, token, opcionesCookie(url));
		redirect(303, '/panel');
	}
};
