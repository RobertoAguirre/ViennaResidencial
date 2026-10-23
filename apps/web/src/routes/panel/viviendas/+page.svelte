<script lang="ts">
	import { RELACIONES } from '$lib/catalogo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Viviendas · {data.fraccionamiento.nombre}</title>
</svelte:head>

<h1 class="text-2xl font-semibold tracking-tight">{data.esComite ? 'Viviendas' : 'Tus viviendas'}</h1>
<p class="mt-2 max-w-2xl text-sm text-tinta/70">
	El dueño y quien habita pueden ser personas distintas. La cuota queda con el dueño. La conducta queda con quien vive ahí.
</p>

{#if data.viviendas.length === 0}
	<p class="tarjeta mt-5 text-tinta/70">No hay viviendas en esta cuenta.</p>
{:else}
	<div class="mt-5 grid gap-3">
		{#each data.viviendas as casa (casa.id)}
			<a class="tarjeta block hover:border-pino/40" href={`/panel/viviendas/${casa.id}`}>
				<div class="flex flex-wrap items-baseline justify-between gap-2">
					<p class="text-lg font-semibold">{casa.direccion}</p>
					<p class="text-sm text-tinta/70">{casa.confirmadas} confirmadas en el año</p>
				</div>
				<p class="mt-2 text-sm">
					Dueño: {casa.duenos.map((persona) => persona.nombre).join(', ') || 'Sin registrar'}
				</p>
				<p class="mt-1 text-sm text-tinta/75">
					Habita:
					{#if casa.habitantes.length === 0}
						nadie registrado
					{:else}
						{casa.habitantes.map((persona) => `${persona.nombre} (${RELACIONES[persona.relacion] ?? persona.relacion})`).join(', ')}
					{/if}
				</p>
				{#if casa.abiertas > 0}
					<p class="mt-2 text-sm font-semibold text-amber-900">{casa.abiertas} por revisar</p>
				{/if}
			</a>
		{/each}
	</div>
{/if}
