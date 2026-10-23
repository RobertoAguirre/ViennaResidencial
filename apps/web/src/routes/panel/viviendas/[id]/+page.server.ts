import { error } from '@sveltejs/kit';
import { esComite, obtenerVivienda, vinculosDeUsuario } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import { publicarIncidencia } from '$lib/server/vista';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const sesion = exigir(locals);
	const vivienda = await obtenerVivienda(sesion.fraccionamiento.id, params.id);
	if (!vivienda) error(404, 'No encontramos esa vivienda.');

	const vinculos = await vinculosDeUsuario(sesion.fraccionamiento.id, sesion.usuario.id);
	const comite = esComite(sesion.roles);
	const esTitular = vinculos.titulares.includes(vivienda.id);
	const esHabitante = vinculos.habitadas.includes(vivienda.id);
	if (!comite && !esTitular && !esHabitante) error(404, 'No encontramos esa vivienda.');

	const verTelefonosDeHabitantes = comite || esTitular;

	return {
		vivienda: {
			id: vivienda.id,
			direccion: vivienda.direccion,
			confirmadas: vivienda.confirmadas,
			abiertas: vivienda.abiertas,
			esTitular,
			esHabitante,
			duenos: vivienda.duenosDetalle.map((persona) => ({
				...persona,
				telefono: comite || esTitular || esHabitante ? persona.telefono : null
			})),
			habitantes: vivienda.habitantesDetalle.map((persona) => ({
				...persona,
				telefono: verTelefonosDeHabitantes || persona.id === sesion.usuario.id ? persona.telefono : null
			})),
			incidencias: vivienda.incidencias.map((item) => publicarIncidencia(item, comite, sesion.usuario.id)),
			cuotas: comite || esTitular ? vivienda.cuotas : []
		}
	};
};
