import { error, fail } from '@sveltejs/kit';
import { esAdmin, esComite, generarCuotas, hoyMexico, listarCuotas, registrarPago, vinculosDeUsuario } from '@vienna/db';
import { pesosACentavos } from '$lib/format';
import { exigir } from '$lib/server/sesion';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const sesion = exigir(locals);
	const comite = esComite(sesion.roles);
	if (!comite && !sesion.roles.includes('dueno')) {
		error(403, 'Las cuotas se consultan desde la cuenta del dueño.');
	}
	const vinculos = await vinculosDeUsuario(sesion.fraccionamiento.id, sesion.usuario.id);
	const cuotas = await listarCuotas(sesion.fraccionamiento.id, comite ? null : vinculos.titulares);
	const saldo = cuotas.reduce((suma, cuota) => suma + cuota.saldo, 0);
	return { cuotas, saldo, hoy: hoyMexico() };
};

export const actions: Actions = {
	pagar: async ({ request, locals }) => {
		const sesion = exigir(locals);
		if (!esAdmin(sesion.roles)) return fail(403, { error: 'Solo administración registra pagos.' });
		const datos = await request.formData();
		const monto = pesosACentavos(String(datos.get('monto') ?? ''));
		const pagadoEn = String(datos.get('pagadoEn') ?? '');
		if (monto == null) return fail(400, { error: 'Escribe el monto en pesos, por ejemplo 1850 o 1850.50.' });
		if (!/^\d{4}-\d{2}-\d{2}$/.test(pagadoEn)) return fail(400, { error: 'Indica la fecha del pago.' });
		const resultado = await registrarPago({
			fraId: sesion.fraccionamiento.id,
			cuotaId: String(datos.get('cuotaId') ?? ''),
			montoCentavos: monto,
			pagadoEn,
			usuarioId: sesion.usuario.id
		});
		if (!resultado.ok) return fail(400, { error: resultado.error });
		return { ok: 'Pago registrado.' };
	},
	generar: async ({ request, locals }) => {
		const sesion = exigir(locals);
		if (!esAdmin(sesion.roles)) return fail(403, { error: 'Solo administración genera cuotas.' });
		const datos = await request.formData();
		const concepto = String(datos.get('concepto') ?? '').trim();
		const periodo = String(datos.get('periodo') ?? '');
		const vencimiento = String(datos.get('vencimiento') ?? '');
		const monto = pesosACentavos(String(datos.get('monto') ?? ''));
		if (concepto.length < 3) return fail(400, { error: 'Escribe el concepto.' });
		if (!/^\d{4}-\d{2}$/.test(periodo)) return fail(400, { error: 'Elige el mes.' });
		if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimiento)) return fail(400, { error: 'Indica el vencimiento.' });
		if (monto == null || monto <= 0) return fail(400, { error: 'Escribe el monto en pesos.' });
		const creadas = await generarCuotas({
			fraId: sesion.fraccionamiento.id,
			concepto,
			periodo,
			montoCentavos: monto,
			vencimiento
		});
		return { ok: creadas === 0 ? 'Esas cuotas ya existían.' : `Quedaron ${creadas} cuotas nuevas.` };
	}
};
