import { error, redirect } from '@sveltejs/kit';
import { cambiarFraccionamiento } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const sesion = exigir(locals);
	if (!sesion.token) redirect(303, '/');
	const datos = await request.formData();
	const id = String(datos.get('fraccionamientoId') ?? '');
	const ok = await cambiarFraccionamiento(sesion.token, sesion.usuario.id, id);
	if (!ok) error(400, 'No perteneces a ese fraccionamiento.');
	redirect(303, '/panel');
};
