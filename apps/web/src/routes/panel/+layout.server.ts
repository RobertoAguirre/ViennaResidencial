import { esAdmin, esComite } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const sesion = exigir(locals);
	const comite = esComite(sesion.roles);
	const nav = [
		{ href: '/panel', etiqueta: 'Inicio' },
		{ href: '/panel/incidencias', etiqueta: 'Incidencias' },
		...(comite ? [{ href: '/panel/reincidentes', etiqueta: 'Reincidentes' }] : []),
		{ href: '/panel/viviendas', etiqueta: 'Viviendas' },
		...(comite ? [{ href: '/panel/personas', etiqueta: 'Personas' }] : []),
		...(comite || sesion.roles.includes('dueno') ? [{ href: '/panel/cuotas', etiqueta: 'Cuotas' }] : [])
	];

	return {
		usuario: sesion.usuario,
		fraccionamiento: sesion.fraccionamiento,
		roles: sesion.roles,
		membresias: sesion.membresias,
		nav,
		esAdmin: esAdmin(sesion.roles),
		esComite: comite
	};
};
