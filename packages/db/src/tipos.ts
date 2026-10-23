export type Rol = 'administracion' | 'comite' | 'dueno' | 'habitante';

export type UsuarioSesion = {
	id: string;
	nombre: string;
	correo: string;
};

export type FraccionamientoSesion = {
	id: string;
	nombre: string;
	ciudad: string;
	estado: string;
};

export type MembresiaSesion = {
	fraccionamientoId: string;
	nombre: string;
	ciudad: string;
	estado: string;
	roles: Rol[];
};

export type Sesion = {
	usuario: UsuarioSesion;
	fraccionamiento: FraccionamientoSesion;
	roles: Rol[];
	membresias: MembresiaSesion[];
};

export type Vinculos = {
	titulares: string[];
	habitadas: string[];
};

const ROLES = new Set<Rol>(['administracion', 'comite', 'dueno', 'habitante']);

export function comoRol(valor: string): Rol | null {
	return ROLES.has(valor as Rol) ? (valor as Rol) : null;
}

export function esComite(roles: Rol[]) {
	return roles.includes('administracion') || roles.includes('comite');
}

export function esAdmin(roles: Rol[]) {
	return roles.includes('administracion');
}

export function direccion(calle: string, numero: string) {
	return `${calle} ${numero}`;
}

export function hoyMexico() {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
}

export function clasificarReincidencia(en90: number, en365: number) {
	if (en365 < 2) return null;
	if (en90 >= 2) return 'reciente' as const;
	return 'reincidente' as const;
}
