import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const PASSWORD_DEMO = 'Demo-2026';

export async function hashContrasena(contrasena: string) {
	const sal = randomBytes(16).toString('hex');
	const derivado = (await scryptAsync(contrasena, sal, 64)) as Buffer;
	return `${sal}:${derivado.toString('hex')}`;
}

export async function verificarContrasena(contrasena: string, guardada: string) {
	const [sal, clave] = guardada.split(':');
	if (!sal || !clave) return false;
	const derivado = (await scryptAsync(contrasena, sal, 64)) as Buffer;
	const claveGuardada = Buffer.from(clave, 'hex');
	if (derivado.length !== claveGuardada.length) return false;
	return timingSafeEqual(derivado, claveGuardada);
}
