import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.usuario) redirect(303, '/panel');
	if (!locals.cuentaSinFraccionamiento || !locals.correoGoogle) redirect(303, '/');
	return { correo: locals.correoGoogle };
};
