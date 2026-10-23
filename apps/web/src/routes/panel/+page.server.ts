import { esComite, resumenInicio, vinculosDeUsuario } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import { publicarIncidencia } from '$lib/server/vista';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const sesion = exigir(locals);
	const vinculos = await vinculosDeUsuario(sesion.fraccionamiento.id, sesion.usuario.id);
	const resumen = await resumenInicio(sesion.fraccionamiento.id, sesion.usuario.id, sesion.roles, vinculos);
	const comite = esComite(sesion.roles);
	return {
		resumen: {
			...resumen,
			recientes: resumen.recientes.map((item) => publicarIncidencia(item, comite, sesion.usuario.id))
		},
		viveAqui: vinculos.habitadas.length > 0,
		esTitular: vinculos.titulares.length > 0
	};
};
