import { fail, redirect } from '@sveltejs/kit';
import { crearIncidencia, listarDirecciones } from '@vienna/db';
import { CATEGORIAS, GRAVEDADES } from '$lib/catalogo';
import { exigir } from '$lib/server/sesion';
import type { Actions, PageServerLoad } from './$types';

function valoresDe(datos: FormData) {
	return {
		viviendaId: String(datos.get('viviendaId') ?? ''),
		categoria: String(datos.get('categoria') ?? ''),
		gravedad: String(datos.get('gravedad') ?? ''),
		descripcion: String(datos.get('descripcion') ?? ''),
		ocurrioEn: String(datos.get('ocurrioEn') ?? '')
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	const sesion = exigir(locals);
	return { viviendas: await listarDirecciones(sesion.fraccionamiento.id) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const sesion = exigir(locals);
		const datos = await request.formData();
		const valores = valoresDe(datos);
		if (!valores.viviendaId) return fail(400, { error: 'Elige la vivienda.', valores });
		if (!CATEGORIAS.some((item) => item.id === valores.categoria)) {
			return fail(400, { error: 'Elige el tipo de conducta.', valores });
		}
		if (!GRAVEDADES.some((item) => item.id === valores.gravedad)) {
			return fail(400, { error: 'Elige la gravedad.', valores });
		}
		if (valores.descripcion.trim().length < 15) {
			return fail(400, { error: 'Describe qué pasó, con un poco más de detalle.', valores });
		}
		if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valores.ocurrioEn)) {
			return fail(400, { error: 'Indica la fecha y la hora.', valores });
		}
		const ocurrioEn = new Date(`${valores.ocurrioEn}:00-06:00`);
		if (Number.isNaN(ocurrioEn.getTime())) return fail(400, { error: 'La fecha no es válida.', valores });
		if (ocurrioEn.getTime() > Date.now() + 5 * 60 * 1000) {
			return fail(400, { error: 'La fecha no puede estar en el futuro.', valores });
		}

		const creada = await crearIncidencia({
			fraId: sesion.fraccionamiento.id,
			viviendaId: valores.viviendaId,
			usuarioId: sesion.usuario.id,
			categoria: valores.categoria,
			gravedad: valores.gravedad,
			descripcion: valores.descripcion,
			ocurrioEn
		});
		if (!creada.ok) return fail(400, { error: creada.error, valores });
		redirect(303, `/panel/incidencias/${creada.id}`);
	}
};
