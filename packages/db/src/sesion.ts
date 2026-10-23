import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { PASSWORD_DEMO, verificarContrasena } from './auth';
import { getDb } from './client';
import { fraccionamientos, membresias, sesiones, usuarios } from './schema';
import { comoRol, type FraccionamientoSesion, type MembresiaSesion, type Rol, type Sesion } from './tipos';

const DIAS_SESION = 14;
const DESTACADAS = ['usr-elena', 'usr-luis', 'usr-mariana', 'usr-diego'];

export async function validarCredenciales(correo: string, contrasena: string) {
	const db = await getDb();
	const filasUsuario = await db
		.select()
		.from(usuarios)
		.where(eq(usuarios.correo, correo.trim().toLowerCase()))
		.limit(1);
	const usuario = filasUsuario[0];
	if (!usuario?.hashContrasena) return null;
	const valida = await verificarContrasena(contrasena, usuario.hashContrasena);
	if (!valida) return null;
	return { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
}

export async function membresiasDe(usuarioId: string): Promise<MembresiaSesion[]> {
	const db = await getDb();
	const filas = await db
		.select({
			rol: membresias.rol,
			fraccionamientoId: fraccionamientos.id,
			nombre: fraccionamientos.nombre,
			ciudad: fraccionamientos.ciudad,
			estado: fraccionamientos.estado
		})
		.from(membresias)
		.innerJoin(fraccionamientos, eq(fraccionamientos.id, membresias.fraccionamientoId))
		.where(eq(membresias.usuarioId, usuarioId));

	const grupos = new Map<string, MembresiaSesion>();
	for (const fila of filas) {
		const rol = comoRol(fila.rol);
		if (!rol) continue;
		const actual = grupos.get(fila.fraccionamientoId);
		if (actual) {
			actual.roles.push(rol);
			continue;
		}
		grupos.set(fila.fraccionamientoId, {
			fraccionamientoId: fila.fraccionamientoId,
			nombre: fila.nombre,
			ciudad: fila.ciudad,
			estado: fila.estado,
			roles: [rol]
		});
	}
	return [...grupos.values()];
}

export async function crearSesion(usuarioId: string, fraccionamientoId: string) {
	const db = await getDb();
	const token = randomBytes(32).toString('hex');
	const expiraEn = new Date(Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000);
	await db.insert(sesiones).values({ token, usuarioId, fraccionamientoId, expiraEn });
	return token;
}

export async function cerrarSesion(token: string) {
	const db = await getDb();
	await db.delete(sesiones).where(eq(sesiones.token, token));
}

export async function cambiarFraccionamiento(token: string, usuarioId: string, fraccionamientoId: string) {
	const membresiasUsuario = await membresiasDe(usuarioId);
	const destino = membresiasUsuario.find((item) => item.fraccionamientoId === fraccionamientoId);
	if (!destino) return false;
	const db = await getDb();
	await db.update(sesiones).set({ fraccionamientoId }).where(eq(sesiones.token, token));
	return true;
}

export async function leerSesion(token: string): Promise<Sesion | null> {
	const db = await getDb();
	const encontradas = await db.select().from(sesiones).where(eq(sesiones.token, token)).limit(1);
	const sesion = encontradas[0];
	if (!sesion) return null;
	if (sesion.expiraEn.getTime() < Date.now()) {
		await db.delete(sesiones).where(eq(sesiones.token, token));
		return null;
	}

	const usuarioFilas = await db.select().from(usuarios).where(eq(usuarios.id, sesion.usuarioId)).limit(1);
	const usuario = usuarioFilas[0];
	if (!usuario) return null;

	const lista = await membresiasDe(usuario.id);
	if (lista.length === 0) {
		await db.delete(sesiones).where(eq(sesiones.token, token));
		return null;
	}

	let actual = lista.find((item) => item.fraccionamientoId === sesion.fraccionamientoId);
	if (!actual) {
		actual = lista[0];
		await db.update(sesiones).set({ fraccionamientoId: actual.fraccionamientoId }).where(eq(sesiones.token, token));
	}

	const fraccionamiento: FraccionamientoSesion = {
		id: actual.fraccionamientoId,
		nombre: actual.nombre,
		ciudad: actual.ciudad,
		estado: actual.estado
	};

	return {
		usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
		fraccionamiento,
		roles: actual.roles,
		membresias: lista
	};
}

export async function listarCuentasDemo() {
	if (process.env.VIENNA_DEMO === '0') return null;
	if (process.env.DATABASE_URL && process.env.VIENNA_DEMO !== '1') return null;

	const db = await getDb();
	const filas = await db
		.select({
			id: usuarios.id,
			nombre: usuarios.nombre,
			correo: usuarios.correo,
			rol: membresias.rol,
			fraccionamientoId: fraccionamientos.id,
			fraccionamiento: fraccionamientos.nombre
		})
		.from(usuarios)
		.innerJoin(membresias, eq(membresias.usuarioId, usuarios.id))
		.innerJoin(fraccionamientos, eq(fraccionamientos.id, membresias.fraccionamientoId));

	const cuentas = new Map<
		string,
		{
			id: string;
			nombre: string;
			correo: string;
			fraccionamientos: { nombre: string; roles: Rol[] }[];
		}
	>();

	for (const fila of filas) {
		if (!fila.correo.endsWith('@vienna.local')) continue;
		const rol = comoRol(fila.rol);
		if (!rol) continue;
		let cuenta = cuentas.get(fila.id);
		if (!cuenta) {
			cuenta = { id: fila.id, nombre: fila.nombre, correo: fila.correo, fraccionamientos: [] };
			cuentas.set(fila.id, cuenta);
		}
		let grupo = cuenta.fraccionamientos.find((item) => item.nombre === fila.fraccionamiento);
		if (!grupo) {
			grupo = { nombre: fila.fraccionamiento, roles: [] };
			cuenta.fraccionamientos.push(grupo);
		}
		grupo.roles.push(rol);
	}

	const todas = [...cuentas.values()];
	if (todas.length === 0) return null;
	const destacadas = DESTACADAS.map((id) => todas.find((cuenta) => cuenta.id === id)).filter((cuenta) => cuenta != null);
	const otras = todas.filter((cuenta) => !DESTACADAS.includes(cuenta.id)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
	return { password: PASSWORD_DEMO, destacadas, otras };
}

export async function vincularUsuarioGoogle(datos: { supabaseId: string; correo: string; nombre: string }) {
	const db = await getDb();
	const correo = datos.correo.trim().toLowerCase();
	const nombre = datos.nombre.trim() || 'Vecino';

	const porIdentidad = await db.select().from(usuarios).where(eq(usuarios.supabaseId, datos.supabaseId)).limit(1);
	if (porIdentidad[0]) {
		return { id: porIdentidad[0].id, nombre: porIdentidad[0].nombre, correo: porIdentidad[0].correo };
	}

	const porCorreo = await db.select().from(usuarios).where(eq(usuarios.correo, correo)).limit(1);
	if (porCorreo[0]) {
		await db.update(usuarios).set({ supabaseId: datos.supabaseId }).where(eq(usuarios.id, porCorreo[0].id));
		return { id: porCorreo[0].id, nombre: porCorreo[0].nombre, correo: porCorreo[0].correo };
	}

	await db.insert(usuarios).values({
		id: datos.supabaseId,
		nombre,
		correo,
		telefono: null,
		hashContrasena: null,
		supabaseId: datos.supabaseId
	});
	return { id: datos.supabaseId, nombre, correo };
}
