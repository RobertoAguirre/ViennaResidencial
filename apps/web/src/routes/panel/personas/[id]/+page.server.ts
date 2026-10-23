import { error } from '@sveltejs/kit';
import { esComite, obtenerPersona } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const sesion = exigir(locals);
	if (!esComite(sesion.roles)) error(403, 'El expediente es solo para administración y comité.');
	const persona = await obtenerPersona(sesion.fraccionamiento.id, params.id);
	if (!persona) error(404, 'No encontramos a esa persona en este fraccionamiento.');
	return { persona };
};
