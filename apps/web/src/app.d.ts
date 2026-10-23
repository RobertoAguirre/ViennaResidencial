import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			token: string | null;
			usuario: { id: string; nombre: string; correo: string } | null;
			fraccionamiento: { id: string; nombre: string; ciudad: string; estado: string } | null;
			roles: Array<'administracion' | 'comite' | 'dueno' | 'habitante'>;
			membresias: Array<{
				fraccionamientoId: string;
				nombre: string;
				ciudad: string;
				estado: string;
				roles: Array<'administracion' | 'comite' | 'dueno' | 'habitante'>;
			}>;
			supabase: SupabaseClient | null;
			correoGoogle: string | null;
			cuentaSinFraccionamiento: boolean;
		}
	}
}

export {};
