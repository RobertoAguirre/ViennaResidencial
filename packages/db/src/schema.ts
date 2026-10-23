import { date, integer, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const fraccionamientos = pgTable('fraccionamientos', {
	id: text('id').primaryKey(),
	nombre: text('nombre').notNull(),
	ciudad: text('ciudad').notNull(),
	estado: text('estado').notNull(),
	creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow()
});

export const usuarios = pgTable('usuarios', {
	id: text('id').primaryKey(),
	nombre: text('nombre').notNull(),
	correo: text('correo').notNull().unique(),
	telefono: text('telefono'),
	hashContrasena: text('hash_contrasena'),
	supabaseId: text('supabase_id').unique(),
	creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow()
});

export const sesiones = pgTable('sesiones', {
	token: text('token').primaryKey(),
	usuarioId: text('usuario_id')
		.notNull()
		.references(() => usuarios.id),
	fraccionamientoId: text('fraccionamiento_id')
		.notNull()
		.references(() => fraccionamientos.id),
	expiraEn: timestamp('expira_en', { withTimezone: true }).notNull()
});

export const membresias = pgTable('membresias', {
	id: text('id').primaryKey(),
	usuarioId: text('usuario_id')
		.notNull()
		.references(() => usuarios.id),
	fraccionamientoId: text('fraccionamiento_id')
		.notNull()
		.references(() => fraccionamientos.id),
	rol: text('rol').notNull()
});

export const viviendas = pgTable('viviendas', {
	id: text('id').primaryKey(),
	fraccionamientoId: text('fraccionamiento_id')
		.notNull()
		.references(() => fraccionamientos.id),
	calle: text('calle').notNull(),
	numero: text('numero').notNull()
});

export const titularidades = pgTable('titularidades', {
	id: text('id').primaryKey(),
	viviendaId: text('vivienda_id')
		.notNull()
		.references(() => viviendas.id),
	usuarioId: text('usuario_id')
		.notNull()
		.references(() => usuarios.id),
	desde: date('desde', { mode: 'string' }).notNull(),
	hasta: date('hasta', { mode: 'string' })
});

export const ocupaciones = pgTable('ocupaciones', {
	id: text('id').primaryKey(),
	viviendaId: text('vivienda_id')
		.notNull()
		.references(() => viviendas.id),
	usuarioId: text('usuario_id')
		.notNull()
		.references(() => usuarios.id),
	relacion: text('relacion').notNull(),
	desde: date('desde', { mode: 'string' }).notNull(),
	hasta: date('hasta', { mode: 'string' })
});

export const incidencias = pgTable('incidencias', {
	id: text('id').primaryKey(),
	fraccionamientoId: text('fraccionamiento_id')
		.notNull()
		.references(() => fraccionamientos.id),
	viviendaId: text('vivienda_id')
		.notNull()
		.references(() => viviendas.id),
	reportadaPor: text('reportada_por')
		.notNull()
		.references(() => usuarios.id),
	categoria: text('categoria').notNull(),
	gravedad: text('gravedad').notNull(),
	descripcion: text('descripcion').notNull(),
	ocurrioEn: timestamp('ocurrio_en', { withTimezone: true }).notNull(),
	estado: text('estado').notNull(),
	respuesta: text('respuesta'),
	notasInternas: text('notas_internas'),
	creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow()
});

export const implicados = pgTable(
	'implicados',
	{
		incidenciaId: text('incidencia_id')
			.notNull()
			.references(() => incidencias.id),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuarios.id)
	},
	(tabla) => [primaryKey({ columns: [tabla.incidenciaId, tabla.usuarioId] })]
);

export const sucesos = pgTable('sucesos', {
	id: text('id').primaryKey(),
	incidenciaId: text('incidencia_id')
		.notNull()
		.references(() => incidencias.id),
	usuarioId: text('usuario_id')
		.notNull()
		.references(() => usuarios.id),
	accion: text('accion').notNull(),
	creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow()
});

export const cuotas = pgTable(
	'cuotas',
	{
		id: text('id').primaryKey(),
		fraccionamientoId: text('fraccionamiento_id')
			.notNull()
			.references(() => fraccionamientos.id),
		viviendaId: text('vivienda_id')
			.notNull()
			.references(() => viviendas.id),
		concepto: text('concepto').notNull(),
		periodo: text('periodo').notNull(),
		montoCentavos: integer('monto_centavos').notNull(),
		vencimiento: date('vencimiento', { mode: 'string' }).notNull()
	},
	(tabla) => [unique('cuotas_vivienda_periodo').on(tabla.viviendaId, tabla.periodo, tabla.concepto)]
);

export const pagos = pgTable('pagos', {
	id: text('id').primaryKey(),
	cuotaId: text('cuota_id')
		.notNull()
		.references(() => cuotas.id),
	montoCentavos: integer('monto_centavos').notNull(),
	pagadoEn: date('pagado_en', { mode: 'string' }).notNull(),
	registradoPor: text('registrado_por')
		.notNull()
		.references(() => usuarios.id)
});
