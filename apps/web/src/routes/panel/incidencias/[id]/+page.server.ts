import { error, fail, redirect } from '@sveltejs/kit';
import { esComite, obtenerIncidencia, resolverIncidencia, vinculosDeUsuario } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const sesion = exigir(locals);
	const incidencia = await obtenerIncidencia(sesion.fraccionamiento.id, params.id);
	if (!incidencia) error(404, 'No encontramos esa incidencia.');

	const vinculos = await vinculosDeUsuario(sesion.fraccionamiento.id, sesion.usuario.id);
	const comite = esComite(sesion.roles);
	const esTitular = vinculos.titulares.includes(incidencia.viviendaId);
	const esHabitante = vinculos.habitadas.includes(incidencia.viviendaId);
	const propia = incidencia.reportadaPor === sesion.usuario.id;
	if (!comite && !esTitular && !esHabitante && !propia) error(404, 'No encontramos esa incidencia.');

	const verPersonas = comite || esTitular;
	const abierta = incidencia.estado === 'reportada' || incidencia.estado === 'en_revision';

	return {
		incidencia: {
			id: incidencia.id,
			categoria: incidencia.categoria,
			gravedad: incidencia.gravedad,
			descripcion: incidencia.descripcion,
			estado: incidencia.estado,
			ocurrioEn: incidencia.ocurrioEn,
			creadaEn: incidencia.creadaEn,
			direccion: incidencia.direccion,
			viviendaId: incidencia.viviendaId,
			respuesta: incidencia.respuesta,
			notasInternas: comite ? incidencia.notasInternas : null,
			reportante: comite ? incidencia.reportante : null,
			propia,
			implicados: verPersonas ? incidencia.implicados : [],
			ocupantes: verPersonas ? incidencia.ocupantes : [],
			sucesos: comite ? incidencia.sucesos : [],
			puedeResolver: comite && abierta
		}
	};
};

async function resolver(
	locals: App.Locals,
	params: { id: string },
	request: Request,
	accion: 'en_revision' | 'confirmada' | 'desestimada'
) {
	const sesion = exigir(locals);
	if (!esComite(sesion.roles)) error(403, 'Solo administración y comité pueden revisar incidencias.');
	const datos = await request.formData();
	const respuesta = String(datos.get('respuesta') ?? '');
	const notas = String(datos.get('notas') ?? '');
	if (accion !== 'en_revision' && respuesta.trim().length < 5) {
		return fail(400, { error: 'Escribe una respuesta breve. Quien reportó sí la va a ver.' });
	}
	const resultado = await resolverIncidencia({
		fraId: sesion.fraccionamiento.id,
		incidenciaId: params.id,
		actorId: sesion.usuario.id,
		accion,
		respuesta,
		notasInternas: notas,
		implicadosIds: datos.getAll('implicado').map(String)
	});
	if (!resultado.ok) return fail(400, { error: resultado.error });
	redirect(303, `/panel/incidencias/${params.id}`);
}

export const actions: Actions = {
	revision: ({ locals, params, request }) => resolver(locals, params, request, 'en_revision'),
	confirmar: ({ locals, params, request }) => resolver(locals, params, request, 'confirmada'),
	desestimar: ({ locals, params, request }) => resolver(locals, params, request, 'desestimada')
};
