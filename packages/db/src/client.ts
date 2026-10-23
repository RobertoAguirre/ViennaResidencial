import { drizzle as drizzlePg, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { fraccionamientos } from './schema';
import { sembrar } from './seed';
import { schemaSql } from './sql';

export type AppDb = PostgresJsDatabase<typeof schema>;

const estado = globalThis as unknown as { viennaDb?: Promise<AppDb> };

async function sembrarSiToca(db: AppDb) {
	if (process.env.VIENNA_SEED !== '1') return;
	const existentes = await db.select({ id: fraccionamientos.id }).from(fraccionamientos).limit(1);
	if (existentes.length > 0) return;
	await sembrar(db);
}

async function abrir(): Promise<AppDb> {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('Falta DATABASE_URL en apps/web/.env. Vienna usa la base de Supabase.');
	}

	const cliente = postgres(url, {
		prepare: false,
		max: process.env.VERCEL ? 1 : 5
	});
	await cliente.unsafe(schemaSql);
	const db = drizzlePg({ client: cliente, schema });
	await sembrarSiToca(db);
	console.log('Vienna conectada a Supabase.');
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
