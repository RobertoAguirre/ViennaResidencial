import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { filas, getDb } from './client';
import {
	cuotas,
	implicados,
	incidencias,
	membresias,
	ocupaciones,
	pagos,
	sucesos,
	titularidades,
	usuarios,
	viviendas
} from './schema';
import { clasificarReincidencia, direccion, esComite, hoyMexico, type Rol, type Vinculos } from './tipos';

function numero(valor: unknown) {
	return Number(valor ?? 0);
}

export async function vinculosDeUsuario(fraId: string, usuarioId: string): Promise<Vinculos> {
	const db = await getDb();
	const titulares = await db
		.select({ viviendaId: titularidades.viviendaId })
		.from(titularidades)
		.innerJoin(viviendas, eq(viviendas.id, titularidades.viviendaId))
		.where(
			and(eq(titularidades.usuarioId, usuarioId), isNull(titularidades.hasta), eq(viviendas.fraccionamientoId, fraId))
		);
	const habitadas = await db
		.select({ viviendaId: ocupaciones.viviendaId })
		.from(ocupaciones)
		.innerJoin(viviendas, eq(viviendas.id, ocupaciones.viviendaId))
		.where(and(eq(ocupaciones.usuarioId, usuarioId), isNull(ocupaciones.hasta), eq(viviendas.fraccionamientoId, fraId)));
	return {
		titulares: titulares.map((fila) => fila.viviendaId),
		habitadas: habitadas.map((fila) => fila.viviendaId)
	};
}

export function viviendasRelacionadas(vinculos: Vinculos) {
	return [...new Set([...vinculos.titulares, ...vinculos.habitadas])];
}

async function personasDeLaVivienda(viviendaId: string) {
	const db = await getDb();
	const duenos = await db
		.select({ usuarioId: titularidades.usuarioId })
		.from(titularidades)
		.where(eq(titularidades.viviendaId, viviendaId));
	const habitantes = await db
		.select({ usuarioId: ocupaciones.usuarioId })
		.from(ocupaciones)
		.where(eq(ocupaciones.viviendaId, viviendaId));
	return new Set([...duenos, ...habitantes].map((fila) => fila.usuarioId));
}

export async function listarDirecciones(fraId: string) {
	const db = await getDb();
	const filasVivienda = await db
		.select()
		.from(viviendas)
		.where(eq(viviendas.fraccionamientoId, fraId))
		.orderBy(viviendas.calle, viviendas.numero);
	return filasVivienda.map((vivienda) => ({
		id: vivienda.id,
		direccion: direccion(vivienda.calle, vivienda.numero)
	}));
}

type FiltroIncidencias = {
	estado?: string;
	categoria?: string;
	restringir: boolean;
	viviendaIds: string[];
	usuarioId: string;
};

export async function listarIncidencias(fraId: string, filtro: FiltroIncidencias) {
	const db = await getDb();
	const condiciones = [eq(incidencias.fraccionamientoId, fraId)];
	if (filtro.categoria) condiciones.push(eq(incidencias.categoria, filtro.categoria));
	if (filtro.estado === 'por_revisar') condiciones.push(inArray(incidencias.estado, ['reportada', 'en_revision']));
	else if (filtro.estado) condiciones.push(eq(incidencias.estado, filtro.estado));

	if (filtro.restringir) {
		const partes = [];
		if (filtro.viviendaIds.length > 0) partes.push(inArray(incidencias.viviendaId, filtro.viviendaIds));
		partes.push(eq(incidencias.reportadaPor, filtro.usuarioId));
		const combinado = or(...partes);
		if (combinado) condiciones.push(combinado);
	}

	const filasIncidencia = await db
		.select({
			id: incidencias.id,
			categoria: incidencias.categoria,
			gravedad: incidencias.gravedad,
			estado: incidencias.estado,
			ocurrioEn: incidencias.ocurrioEn,
			viviendaId: viviendas.id,
			calle: viviendas.calle,
			numero: viviendas.numero,
			reportadaPor: incidencias.reportadaPor,
			reportante: usuarios.nombre
		})
		.from(incidencias)
		.innerJoin(viviendas, eq(viviendas.id, incidencias.viviendaId))
		.innerJoin(usuarios, eq(usuarios.id, incidencias.reportadaPor))
		.where(and(...condiciones))
		.orderBy(desc(incidencias.ocurrioEn));

	return filasIncidencia.map((fila) => ({
		...fila,
		direccion: direccion(fila.calle, fila.numero)
	}));
}

export async function obtenerIncidencia(fraId: string, id: string) {
	const db = await getDb();
	const encontradas = await db
		.select({
			id: incidencias.id,
			categoria: incidencias.categoria,
			gravedad: incidencias.gravedad,
			descripcion: incidencias.descripcion,
			estado: incidencias.estado,
			ocurrioEn: incidencias.ocurrioEn,
			creadaEn: incidencias.creadaEn,
			respuesta: incidencias.respuesta,
			notasInternas: incidencias.notasInternas,
			viviendaId: viviendas.id,
			calle: viviendas.calle,
			numero: viviendas.numero,
			reportadaPor: incidencias.reportadaPor,
			reportante: usuarios.nombre
		})
		.from(incidencias)
		.innerJoin(viviendas, eq(viviendas.id, incidencias.viviendaId))
		.innerJoin(usuarios, eq(usuarios.id, incidencias.reportadaPor))
		.where(and(eq(incidencias.id, id), eq(incidencias.fraccionamientoId, fraId)))
		.limit(1);
	const incidencia = encontradas[0];
	if (!incidencia) return null;

	const personas = await db
		.select({ id: usuarios.id, nombre: usuarios.nombre })
		.from(implicados)
		.innerJoin(usuarios, eq(usuarios.id, implicados.usuarioId))
		.where(eq(implicados.incidenciaId, id));

	const ocupantes = await db
		.select({
			id: usuarios.id,
			nombre: usuarios.nombre,
			telefono: usuarios.telefono,
			relacion: ocupaciones.relacion
		})
		.from(ocupaciones)
		.innerJoin(usuarios, eq(usuarios.id, ocupaciones.usuarioId))
		.where(and(eq(ocupaciones.viviendaId, incidencia.viviendaId), isNull(ocupaciones.hasta)))
		.orderBy(usuarios.nombre);

	const linea = await db
		.select({ accion: sucesos.accion, creadoEn: sucesos.creadoEn, nombre: usuarios.nombre })
		.from(sucesos)
		.innerJoin(usuarios, eq(usuarios.id, sucesos.usuarioId))
		.where(eq(sucesos.incidenciaId, id))
		.orderBy(sucesos.creadoEn);

	return {
		...incidencia,
		direccion: direccion(incidencia.calle, incidencia.numero),
		implicados: personas,
		ocupantes,
		sucesos: linea
	};
}

export async function crearIncidencia(input: {
	fraId: string;
	viviendaId: string;
	usuarioId: string;
	categoria: string;
	gravedad: string;
	descripcion: string;
	ocurrioEn: Date;
}) {
	const db = await getDb();
	const casa = await db
		.select({ id: viviendas.id })
		.from(viviendas)
		.where(and(eq(viviendas.id, input.viviendaId), eq(viviendas.fraccionamientoId, input.fraId)))
		.limit(1);
	if (!casa[0]) return { ok: false as const, error: 'Esa vivienda no está en este fraccionamiento.' };

	const id = randomUUID();
	await db.insert(incidencias).values({
		id,
		fraccionamientoId: input.fraId,
		viviendaId: input.viviendaId,
		reportadaPor: input.usuarioId,
		categoria: input.categoria,
		gravedad: input.gravedad,
		descripcion: input.descripcion.trim(),
		ocurrioEn: input.ocurrioEn,
		estado: 'reportada',
		respuesta: null,
		notasInternas: null
	});
	await db.insert(sucesos).values({
		id: randomUUID(),
		incidenciaId: id,
		usuarioId: input.usuarioId,
		accion: 'Registró la incidencia'
	});
	return { ok: true as const, id };
}

export async function resolverIncidencia(input: {
	fraId: string;
	incidenciaId: string;
	actorId: string;
	accion: 'en_revision' | 'confirmada' | 'desestimada';
	respuesta: string;
	notasInternas: string;
	implicadosIds: string[];
}) {
	const db = await getDb();
	const encontradas = await db
		.select()
		.from(incidencias)
		.where(and(eq(incidencias.id, input.incidenciaId), eq(incidencias.fraccionamientoId, input.fraId)))
		.limit(1);
	const actual = encontradas[0];
	if (!actual) return { ok: false as const, error: 'No encontramos esa incidencia.' };
	if (actual.estado === 'confirmada' || actual.estado === 'desestimada') {
		return { ok: false as const, error: 'Esta incidencia ya está cerrada.' };
	}

	let implicadosValidos: string[] = [];
	if (input.accion === 'confirmada') {
		const permitidos = await personasDeLaVivienda(actual.viviendaId);
		implicadosValidos = input.implicadosIds.filter((id) => permitidos.has(id));
	}

	await db
		.update(incidencias)
		.set({
			estado: input.accion,
			respuesta: input.respuesta.trim() || null,
			notasInternas: input.notasInternas.trim() || actual.notasInternas
		})
		.where(eq(incidencias.id, input.incidenciaId));

	if (input.accion === 'confirmada') {
		await db.delete(implicados).where(eq(implicados.incidenciaId, input.incidenciaId));
		if (implicadosValidos.length > 0) {
			await db.insert(implicados).values(
				implicadosValidos.map((usuarioId) => ({
					incidenciaId: input.incidenciaId,
					usuarioId
				}))
			);
		}
	}

	const texto =
		input.accion === 'confirmada' ? 'La confirmó' : input.accion === 'desestimada' ? 'La desestimó' : 'La pasó a revisión';
	await db.insert(sucesos).values({
		id: randomUUID(),
		incidenciaId: input.incidenciaId,
		usuarioId: input.actorId,
		accion: texto
	});
	return { ok: true as const };
}

async function conteoPersonas(fraId: string) {
	const db = await getDb();
	const resultado = await db.execute(sql`
		select im.usuario_id as id,
			count(*) filter (where i.estado = 'confirmada' and i.ocurrio_en >= now() - interval '90 days') as en90,
			count(*) filter (where i.estado = 'confirmada' and i.ocurrio_en >= now() - interval '365 days') as en365
		from implicados im
		join incidencias i on i.id = im.incidencia_id
		where i.fraccionamiento_id = ${fraId}
		group by im.usuario_id
	`);
	return filas<{ id: string; en90: unknown; en365: unknown }>(resultado).map((fila) => ({
		id: fila.id,
		en90: numero(fila.en90),
		en365: numero(fila.en365)
	}));
}

async function conteoViviendas(fraId: string) {
	const db = await getDb();
	const resultado = await db.execute(sql`
		select vivienda_id as id,
			count(*) filter (where estado = 'confirmada' and ocurrio_en >= now() - interval '365 days') as en365,
			count(*) filter (where estado in ('reportada', 'en_revision')) as abiertas
		from incidencias
		where fraccionamiento_id = ${fraId}
		group by vivienda_id
	`);
	return filas<{ id: string; en365: unknown; abiertas: unknown }>(resultado).map((fila) => ({
		id: fila.id,
		en365: numero(fila.en365),
		abiertas: numero(fila.abiertas)
	}));
}

export async function listarReincidentes(fraId: string) {
	const db = await getDb();
	const conteos = await conteoPersonas(fraId);
	const relevantes = conteos.filter((fila) => fila.en365 >= 2);
	const ids = relevantes.map((fila) => fila.id);
	const gente = ids.length
		? await db.select({ id: usuarios.id, nombre: usuarios.nombre }).from(usuarios).where(inArray(usuarios.id, ids))
		: [];
	const ocupantes = await db
		.select({
			usuarioId: ocupaciones.usuarioId,
			relacion: ocupaciones.relacion,
			calle: viviendas.calle,
			numero: viviendas.numero,
			viviendaId: viviendas.id
		})
		.from(ocupaciones)
		.innerJoin(viviendas, eq(viviendas.id, ocupaciones.viviendaId))
		.where(and(eq(viviendas.fraccionamientoId, fraId), isNull(ocupaciones.hasta)));

	const personas = relevantes
		.map((fila) => {
			const persona = gente.find((item) => item.id === fila.id);
			const casa = ocupantes.find((item) => item.usuarioId === fila.id);
			return {
				id: fila.id,
				nombre: persona?.nombre ?? 'Persona',
				en90: fila.en90,
				en365: fila.en365,
				nivel: clasificarReincidencia(fila.en90, fila.en365),
				relacion: casa?.relacion ?? null,
				direccion: casa ? direccion(casa.calle, casa.numero) : null,
				viviendaId: casa?.viviendaId ?? null
			};
		})
		.sort((a, b) => b.en90 - a.en90 || b.en365 - a.en365 || a.nombre.localeCompare(b.nombre, 'es'));

	const porCasa = await conteoViviendas(fraId);
	const casas = await db.select().from(viviendas).where(eq(viviendas.fraccionamientoId, fraId));
	const viviendasRepetidas = porCasa
		.filter((fila) => fila.en365 >= 2)
		.map((fila) => {
			const casa = casas.find((item) => item.id === fila.id);
			const habitantes = ocupantes.filter((item) => item.viviendaId === fila.id).map((item) => item.usuarioId);
			const nombres = habitantes
				.map((id) => gente.find((item) => item.id === id)?.nombre)
				.filter((nombre): nombre is string => Boolean(nombre));
			return {
				id: fila.id,
				direccion: casa ? direccion(casa.calle, casa.numero) : 'Vivienda',
				en365: fila.en365,
				habitantes: nombres
			};
		})
		.sort((a, b) => b.en365 - a.en365 || a.direccion.localeCompare(b.direccion, 'es'));

	const nombresFaltantes = viviendasRepetidas.some((casa) => casa.habitantes.length === 0);
	if (nombresFaltantes || viviendasRepetidas.length > 0) {
		const ocupantesNombres = await db
			.select({ usuarioId: usuarios.id, nombre: usuarios.nombre, viviendaId: ocupaciones.viviendaId })
			.from(ocupaciones)
			.innerJoin(usuarios, eq(usuarios.id, ocupaciones.usuarioId))
			.where(and(inArray(ocupaciones.viviendaId, casas.map((casa) => casa.id)), isNull(ocupaciones.hasta)));
		for (const casa of viviendasRepetidas) {
			casa.habitantes = ocupantesNombres.filter((item) => item.viviendaId === casa.id).map((item) => item.nombre);
		}
	}

	return { personas, viviendas: viviendasRepetidas };
}

export async function listarViviendas(fraId: string, ids: string[] | null) {
	if (ids && ids.length === 0) return [];
	const db = await getDb();
	const condiciones = [eq(viviendas.fraccionamientoId, fraId)];
	if (ids) condiciones.push(inArray(viviendas.id, ids));
	const casas = await db
		.select()
		.from(viviendas)
		.where(and(...condiciones))
		.orderBy(viviendas.calle, viviendas.numero);

	const casaIds = casas.map((casa) => casa.id);
	if (casaIds.length === 0) return [];

	const duenos = await db
		.select({ viviendaId: titularidades.viviendaId, nombre: usuarios.nombre, usuarioId: usuarios.id })
		.from(titularidades)
		.innerJoin(usuarios, eq(usuarios.id, titularidades.usuarioId))
		.where(and(inArray(titularidades.viviendaId, casaIds), isNull(titularidades.hasta)));
	const habitantes = await db
		.select({
			viviendaId: ocupaciones.viviendaId,
			usuarioId: usuarios.id,
			nombre: usuarios.nombre,
			relacion: ocupaciones.relacion
		})
		.from(ocupaciones)
		.innerJoin(usuarios, eq(usuarios.id, ocupaciones.usuarioId))
		.where(and(inArray(ocupaciones.viviendaId, casaIds), isNull(ocupaciones.hasta)));
	const conteos = await conteoViviendas(fraId);

	return casas.map((casa) => ({
		id: casa.id,
		direccion: direccion(casa.calle, casa.numero),
		duenos: duenos
			.filter((item) => item.viviendaId === casa.id)
			.map((item) => ({ id: item.usuarioId, nombre: item.nombre })),
		habitantes: habitantes
			.filter((item) => item.viviendaId === casa.id)
			.map((item) => ({ id: item.usuarioId, nombre: item.nombre, relacion: item.relacion })),
		confirmadas: conteos.find((item) => item.id === casa.id)?.en365 ?? 0,
		abiertas: conteos.find((item) => item.id === casa.id)?.abiertas ?? 0
	}));
}

export async function obtenerVivienda(fraId: string, id: string) {
	const lista = await listarViviendas(fraId, [id]);
	const vivienda = lista[0];
	if (!vivienda) return null;
	const db = await getDb();
	const duenos = await db
		.select({
			id: usuarios.id,
			nombre: usuarios.nombre,
			telefono: usuarios.telefono,
			desde: titularidades.desde
		})
		.from(titularidades)
		.innerJoin(usuarios, eq(usuarios.id, titularidades.usuarioId))
		.where(and(eq(titularidades.viviendaId, id), isNull(titularidades.hasta)));
	const habitantes = await db
		.select({
			id: usuarios.id,
			nombre: usuarios.nombre,
			telefono: usuarios.telefono,
			relacion: ocupaciones.relacion,
			desde: ocupaciones.desde
		})
		.from(ocupaciones)
		.innerJoin(usuarios, eq(usuarios.id, ocupaciones.usuarioId))
		.where(and(eq(ocupaciones.viviendaId, id), isNull(ocupaciones.hasta)));
	const hechos = await listarIncidencias(fraId, {
		restringir: true,
		viviendaIds: [id],
		usuarioId: 'nadie'
	});
	const cargos = await cuotasConSaldo(fraId, [id]);
	return { ...vivienda, duenosDetalle: duenos, habitantesDetalle: habitantes, incidencias: hechos, cuotas: cargos };
}

export async function listarPersonas(fraId: string) {
	const db = await getDb();
	const filasMiembro = await db
		.select({
			id: usuarios.id,
			nombre: usuarios.nombre,
			telefono: usuarios.telefono,
			rol: membresias.rol
		})
		.from(membresias)
		.innerJoin(usuarios, eq(usuarios.id, membresias.usuarioId))
		.where(eq(membresias.fraccionamientoId, fraId))
		.orderBy(usuarios.nombre);
	const conteos = await conteoPersonas(fraId);
	const casas = await listarViviendas(fraId, null);
	const grupos = new Map<
		string,
		{
			id: string;
			nombre: string;
			telefono: string | null;
			roles: string[];
			en90: number;
			en365: number;
			nivel: ReturnType<typeof clasificarReincidencia>;
			lugares: string[];
		}
	>();
	for (const fila of filasMiembro) {
		let persona = grupos.get(fila.id);
		if (!persona) {
			const conteo = conteos.find((item) => item.id === fila.id);
			const en90 = conteo?.en90 ?? 0;
			const en365 = conteo?.en365 ?? 0;
			persona = {
				id: fila.id,
				nombre: fila.nombre,
				telefono: fila.telefono,
				roles: [],
				en90,
				en365,
				nivel: clasificarReincidencia(en90, en365),
				lugares: []
			};
			grupos.set(fila.id, persona);
		}
		persona.roles.push(fila.rol);
	}
	for (const casa of casas) {
		for (const habitante of casa.habitantes) {
			const persona = grupos.get(habitante.id);
			if (!persona || persona.lugares.some((lugar) => lugar.startsWith(casa.direccion))) continue;
			const texto =
				habitante.relacion === 'arrendatario' ? 'renta' : habitante.relacion === 'familiar' ? 'familiar' : 'vive aquí';
			persona.lugares.push(`${casa.direccion} · ${texto}`);
		}
		for (const dueno of casa.duenos) {
			const persona = grupos.get(dueno.id);
			if (!persona || persona.lugares.some((lugar) => lugar.startsWith(casa.direccion))) continue;
			persona.lugares.push(`${casa.direccion} · dueño, no vive aquí`);
		}
	}
	return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function obtenerPersona(fraId: string, id: string) {
	const db = await getDb();
	const miembros = await db
		.select({ rol: membresias.rol, nombre: usuarios.nombre, correo: usuarios.correo, telefono: usuarios.telefono })
		.from(membresias)
		.innerJoin(usuarios, eq(usuarios.id, membresias.usuarioId))
		.where(and(eq(membresias.usuarioId, id), eq(membresias.fraccionamientoId, fraId)));
	if (miembros.length === 0) return null;
	const conteos = await conteoPersonas(fraId);
	const conteo = conteos.find((item) => item.id === id) ?? { en90: 0, en365: 0 };
	const resultado = await db.execute(sql`
		select i.categoria as categoria, count(*) as total
		from implicados im
		join incidencias i on i.id = im.incidencia_id
		where im.usuario_id = ${id}
			and i.fraccionamiento_id = ${fraId}
			and i.estado = 'confirmada'
		group by i.categoria
		order by total desc
	`);
	const porCategoria = filas<{ categoria: string; total: unknown }>(resultado).map((fila) => ({
		categoria: fila.categoria,
		total: numero(fila.total)
	}));
	const hechos = await db
		.select({
			id: incidencias.id,
			categoria: incidencias.categoria,
			gravedad: incidencias.gravedad,
			estado: incidencias.estado,
			ocurrioEn: incidencias.ocurrioEn,
			calle: viviendas.calle,
			numero: viviendas.numero
		})
		.from(implicados)
		.innerJoin(incidencias, eq(incidencias.id, implicados.incidenciaId))
		.innerJoin(viviendas, eq(viviendas.id, incidencias.viviendaId))
		.where(and(eq(implicados.usuarioId, id), eq(incidencias.fraccionamientoId, fraId), eq(incidencias.estado, 'confirmada')))
		.orderBy(desc(incidencias.ocurrioEn));

	const casas = await listarViviendas(fraId, null);
	const lugares = casas
		.filter((casa) => casa.duenos.some((dueno) => dueno.id === id) || casa.habitantes.some((item) => item.id === id))
		.map((casa) => {
			const habitante = casa.habitantes.find((item) => item.id === id);
			return { id: casa.id, direccion: casa.direccion, vinculo: habitante ? habitante.relacion : 'dueno_ausente' };
		});

	return {
		id,
		nombre: miembros[0].nombre,
		correo: miembros[0].correo,
		telefono: miembros[0].telefono,
		roles: miembros.map((item) => item.rol),
		en90: conteo.en90,
		en365: conteo.en365,
		nivel: clasificarReincidencia(conteo.en90, conteo.en365),
		porCategoria,
		incidencias: hechos.map((fila) => ({ ...fila, direccion: direccion(fila.calle, fila.numero) })),
		lugares
	};
}

async function cuotasConSaldo(fraId: string, viviendaIds?: string[]) {
	if (viviendaIds && viviendaIds.length === 0) return [];
	const db = await getDb();
	const condiciones = [eq(cuotas.fraccionamientoId, fraId)];
	if (viviendaIds) condiciones.push(inArray(cuotas.viviendaId, viviendaIds));
	const lista = await db.select().from(cuotas).where(and(...condiciones)).orderBy(desc(cuotas.periodo));
	const ids = lista.map((cuota) => cuota.id);
	const abonos = ids.length ? await db.select().from(pagos).where(inArray(pagos.cuotaId, ids)) : [];
	const pagado = new Map<string, number>();
	for (const pago of abonos) pagado.set(pago.cuotaId, (pagado.get(pago.cuotaId) ?? 0) + pago.montoCentavos);
	const hoy = hoyMexico();
	const casas = await db.select().from(viviendas).where(eq(viviendas.fraccionamientoId, fraId));
	return lista.map((cuota) => {
		const abono = pagado.get(cuota.id) ?? 0;
		const saldo = cuota.montoCentavos - abono;
		const casa = casas.find((item) => item.id === cuota.viviendaId);
		return {
			id: cuota.id,
			viviendaId: cuota.viviendaId,
			direccion: casa ? direccion(casa.calle, casa.numero) : 'Vivienda',
			concepto: cuota.concepto,
			periodo: cuota.periodo,
			montoCentavos: cuota.montoCentavos,
			vencimiento: cuota.vencimiento,
			abono,
			saldo,
			vencida: saldo > 0 && cuota.vencimiento < hoy
		};
	});
}

export async function listarCuotas(fraId: string, viviendaIds: string[] | null) {
	if (viviendaIds && viviendaIds.length === 0) return [];
	return cuotasConSaldo(fraId, viviendaIds ?? undefined);
}

export async function registrarPago(input: {
	fraId: string;
	cuotaId: string;
	montoCentavos: number;
	pagadoEn: string;
	usuarioId: string;
}) {
	const db = await getDb();
	const encontradas = await db
		.select()
		.from(cuotas)
		.where(and(eq(cuotas.id, input.cuotaId), eq(cuotas.fraccionamientoId, input.fraId)))
		.limit(1);
	const cuota = encontradas[0];
	if (!cuota) return { ok: false as const, error: 'No encontramos esa cuota.' };
	const abonos = await db.select().from(pagos).where(eq(pagos.cuotaId, cuota.id));
	const pagado = abonos.reduce((suma, pago) => suma + pago.montoCentavos, 0);
	const saldo = cuota.montoCentavos - pagado;
	if (input.montoCentavos <= 0 || input.montoCentavos > saldo) {
		return { ok: false as const, error: 'El monto tiene que ser mayor a cero y no pasar el saldo.' };
	}
	await db.insert(pagos).values({
		id: randomUUID(),
		cuotaId: cuota.id,
		montoCentavos: input.montoCentavos,
		pagadoEn: input.pagadoEn,
		registradoPor: input.usuarioId
	});
	return { ok: true as const };
}

export async function generarCuotas(input: {
	fraId: string;
	concepto: string;
	periodo: string;
	montoCentavos: number;
	vencimiento: string;
}) {
	const db = await getDb();
	const casas = await db.select().from(viviendas).where(eq(viviendas.fraccionamientoId, input.fraId));
	if (casas.length === 0) return 0;
	const insertadas = await db
		.insert(cuotas)
		.values(
			casas.map((casa) => ({
				id: randomUUID(),
				fraccionamientoId: input.fraId,
				viviendaId: casa.id,
				concepto: input.concepto.trim(),
				periodo: input.periodo,
				montoCentavos: input.montoCentavos,
				vencimiento: input.vencimiento
			}))
		)
		.onConflictDoNothing({ target: [cuotas.viviendaId, cuotas.periodo, cuotas.concepto] })
		.returning({ id: cuotas.id });
	return insertadas.length;
}

export async function resumenInicio(fraId: string, usuarioId: string, roles: Rol[], vinculos: Vinculos) {
	const db = await getDb();
	const relacionadas = viviendasRelacionadas(vinculos);
	const comite = esComite(roles);
	const recientes = await listarIncidencias(fraId, {
		restringir: !comite,
		viviendaIds: relacionadas,
		usuarioId
	});
	const viviendasUsuario = await listarViviendas(fraId, relacionadas);
	const cargos = vinculos.titulares.length ? await cuotasConSaldo(fraId, vinculos.titulares) : [];

	let porRevisar = 0;
	let cuotasVencidas = 0;
	let personas: Awaited<ReturnType<typeof listarReincidentes>>['personas'] = [];
	if (comite) {
		const abiertas = await db
			.select({ id: incidencias.id })
			.from(incidencias)
			.where(and(eq(incidencias.fraccionamientoId, fraId), inArray(incidencias.estado, ['reportada', 'en_revision'])));
		porRevisar = abiertas.length;
		const todas = await cuotasConSaldo(fraId);
		cuotasVencidas = todas.filter((cuota) => cuota.vencida).length;
		personas = (await listarReincidentes(fraId)).personas;
	}

	return {
		porRevisar,
		cuotasVencidas,
		reincidentes: personas.length,
		recientes: recientes.slice(0, 6),
		personas: personas.slice(0, 3),
		viviendas: viviendasUsuario.map((casa) => ({
			...casa,
			saldo: cargos.filter((cuota) => cuota.viviendaId === casa.id).reduce((suma, cuota) => suma + cuota.saldo, 0),
			esTitular: vinculos.titulares.includes(casa.id),
			esHabitante: vinculos.habitadas.includes(casa.id)
		})),
		saldoPropio: cargos.reduce((suma, cuota) => suma + cuota.saldo, 0)
	};
}
