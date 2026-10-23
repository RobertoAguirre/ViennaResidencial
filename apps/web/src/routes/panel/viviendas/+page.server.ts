import { esComite, listarViviendas, vinculosDeUsuario, viviendasRelacionadas } from '@vienna/db';
import { exigir } from '$lib/server/sesion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const sesion = exigir(locals);
	const comite = esComite(sesion.roles);
	const vinculos = await vinculosDeUsuario(sesion.fraccionamiento.id, sesion.usuario.id);
	const ids = comite ? null : viviendasRelacionadas(vinculos);
	return { viviendas: await listarViviendas(sesion.fraccionamiento.id, ids) };
};
