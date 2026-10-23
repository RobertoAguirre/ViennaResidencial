import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePg, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import * as schema from './schema';
import { fraccionamientos } from './schema';
import { sembrar } from './seed';
import { schemaSql } from './sql';

export type AppDb = PostgresJsDatabase<typeof schema>;

const estado = globalThis as unknown as { viennaDb?: Promise<AppDb> };

function directorioDatos() {
	if (process.env.VIENNA_DATA_DIR) return process.env.VIENNA_DATA_DIR;
	if (existsSync(path.resolve(process.cwd(), 'apps/web'))) {
		return path.resolve(process.cwd(), 'data/pglite');
	}
	return path.resolve(process.cwd(), '../../data/pglite');
}

async function sembrarSiToca(db: AppDb) {
	const existentes = await db.select({ id: fraccionamientos.id }).from(fraccionamientos).limit(1);
	if (existentes.length > 0) return;
	const usaRemoto = Boolean(process.env.DATABASE_URL);
	const permitir = process.env.VIENNA_SEED === '1' || (!usaRemoto && process.env.VIENNA_SEED !== '0');
	if (!permitir) return;
	await sembrar(db);
}

async function abrir(): Promise<AppDb> {
	if (process.env.DATABASE_URL) {
		const cliente = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
		await cliente.unsafe(schemaSql);
		const db = drizzlePg({ client: cliente, schema });
		await sembrarSiToca(db);
		console.log('Vienna conectada a Postgres remoto.');
		return db;
	}

	const directorio = directorioDatos();
	mkdirSync(directorio, { recursive: true });
	const cliente = new PGlite(directorio);
	await cliente.waitReady;
	await cliente.exec(schemaSql);
	const db = drizzlePglite({ client: cliente, schema }) as unknown as AppDb;
	await sembrarSiToca(db);
	console.log('Vienna usa Postgres local. Los datos están en /data.');
	return db;
}

export function getDb() {
	if (!estado.viennaDb) {
		estado.viennaDb = abrir().catch((error) => {
			estado.viennaDb = undefined;
			throw error;
		});
	}
	return estado.viennaDb;
}

export function filas<T>(resultado: unknown): T[] {
	if (Array.isArray(resultado)) return resultado as T[];
	if (resultado && typeof resultado === 'object' && 'rows' in resultado) {
		return (resultado as { rows: T[] }).rows;
	}
	return [];
}
