import { error } from '@sveltejs/kit';
import { esComite, listarPersonas } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const sesion = exigir(locals);
	if (!esComite(sesion.roles)) error(403, 'El directorio es solo para administración y comité.');
	return { personas: await listarPersonas(sesion.fraccionamiento.id) };
};
