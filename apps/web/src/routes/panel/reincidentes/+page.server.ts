import { error } from '@sveltejs/kit';
import { esComite, listarReincidentes } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const sesion = exigir(locals);
	if (!esComite(sesion.roles)) error(403, 'Esta lista es solo para administración y comité.');
	return { reincidentes: await listarReincidentes(sesion.fraccionamiento.id) };
};
