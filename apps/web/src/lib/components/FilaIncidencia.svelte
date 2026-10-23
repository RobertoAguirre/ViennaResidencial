<script lang="ts">
	import Pildora from './Pildora.svelte';
	import { CATEGORIAS, GRAVEDADES, nombreDe } from '$lib/catalogo';
	import { fechaHora } from '$lib/format';

	let {
		item
	}: {
		item: {
			id: string;
			categoria: string;
			gravedad: string;
			estado: string;
			ocurrioEn: Date | string;
			direccion: string;
			propia?: boolean;
		};
	} = $props();
</script>

<a class="tarjeta block transition hover:border-pino/40" href={`/panel/incidencias/${item.id}`}>
	<div class="flex items-start justify-between gap-3">
		<div>
			<p class="font-semibold">{nombreDe(CATEGORIAS, item.categoria)}</p>
			<p class="mt-0.5 text-sm text-tinta/70">
				{item.direccion} · {nombreDe(GRAVEDADES, item.gravedad)}
				{#if item.propia}
					· La registraste tú
				{/if}
			</p>
		</div>
		<Pildora estado={item.estado} />
	</div>
	<p class="mt-3 text-sm text-tinta/60">{fechaHora(item.ocurrioEn)}</p>
</a>
