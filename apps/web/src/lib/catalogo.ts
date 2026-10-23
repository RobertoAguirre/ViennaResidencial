export const CATEGORIAS = [
	{ id: 'musica_alta', nombre: 'Música alta' },
	{ id: 'fiesta', nombre: 'Fiesta o reunión' },
	{ id: 'mascotas', nombre: 'Mascotas' },
	{ id: 'basura', nombre: 'Basura o fachada' },
	{ id: 'estacionamiento', nombre: 'Estacionamiento' },
	{ id: 'agresion', nombre: 'Agresión o amenaza' },
	{ id: 'danos', nombre: 'Daños a propiedad' },
	{ id: 'otro', nombre: 'Otro' }
] as const;

export const GRAVEDADES = [
	{ id: 'leve', nombre: 'Leve' },
	{ id: 'moderada', nombre: 'Moderada' },
	{ id: 'grave', nombre: 'Grave' }
] as const;

export const ESTADOS = [
	{ id: 'reportada', nombre: 'Reportada' },
	{ id: 'en_revision', nombre: 'En revisión' },
	{ id: 'confirmada', nombre: 'Confirmada' },
	{ id: 'desestimada', nombre: 'Desestimada' }
] as const;

export const ROLES: Record<string, string> = {
	administracion: 'Administración',
	comite: 'Comité',
	dueno: 'Dueño',
	habitante: 'Habitante'
};

export const RELACIONES: Record<string, string> = {
	dueno: 'Dueño, vive aquí',
	arrendatario: 'Arrendatario',
	familiar: 'Familiar',
	dueno_ausente: 'Dueño, no vive aquí'
};

export function nombreDe(lista: readonly { id: string; nombre: string }[], id: string) {
	return lista.find((item) => item.id === id)?.nombre ?? id;
}

export function textoNivel(nivel: string | null) {
	if (nivel === 'reciente') return 'Reincidente reciente';
	if (nivel === 'reincidente') return 'Reincidente';
	return 'Sin reincidencia';
}
