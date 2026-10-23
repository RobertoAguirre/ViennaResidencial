import { esComite, listarIncidencias, vinculosDeUsuario, viviendasRelacionadas } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import { publicarIncidencia } from '$lib/server/vista';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const sesion = exigir(locals);
	const vinculos = await vinculosDeUsuario(sesion.fraccionamiento.id, sesion.usuario.id);
	const comite = esComite(sesion.roles);
	const estado = url.searchParams.get('estado') ?? '';
	const categoria = url.searchParams.get('categoria') ?? '';
	const lista = await listarIncidencias(sesion.fraccionamiento.id, {
		estado: estado || undefined,
		categoria: categoria || undefined,
		restringir: !comite,
		viviendaIds: viviendasRelacionadas(vinculos),
		usuarioId: sesion.usuario.id
	});

	return {
		estado,
		categoria,
		incidencias: lista.map((item) => publicarIncidencia(item, comite, sesion.usuario.id))
	};
};
