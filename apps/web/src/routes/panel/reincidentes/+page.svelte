<script lang="ts">
	import { RELACIONES, textoNivel } from '$lib/catalogo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Reincidentes · {data.fraccionamiento.nombre}</title>
</svelte:head>

<h1 class="text-2xl font-semibold tracking-tight">Reincidentes</h1>
<p class="mt-2 max-w-2xl text-tinta/75">
	Solo administración y comité. Una persona entra aquí con 2 o más conductas confirmadas en el último año. Si además
	tiene 2 en los últimos 90 días, se marca como reciente. Un reporte nuevo no suma hasta que se confirma.
</p>

<section class="mt-6">
	<h2 class="text-lg font-semibold">Personas</h2>
	{#if data.reincidentes.personas.length === 0}
		<p class="tarjeta mt-3 text-tinta/70">Nadie acumula dos confirmadas en el año.</p>
	{:else}
		<ul class="mt-3 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-tarjeta">
			{#each data.reincidentes.personas as persona (persona.id)}
				<li>
					<a class="block px-4 py-3 hover:bg-papel" href={`/panel/personas/${persona.id}`}>
						<span class="flex flex-wrap items-baseline justify-between gap-2">
							<span class="font-semibold">{persona.nombre}</span>
							<span class="text-sm font-semibold">{textoNivel(persona.nivel)}</span>
						</span>
						<span class="mt-1 block text-sm text-tinta/70">
							{persona.direccion ?? 'Sin vivienda de habitante'}
							{#if persona.relacion}
								· {RELACIONES[persona.relacion] ?? persona.relacion}
							{/if}
							· {persona.en90} en 90 días · {persona.en365} en el año
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="mt-8">
	<h2 class="text-lg font-semibold">Viviendas que se repiten</h2>
	<p class="mt-1 text-sm text-tinta/70">Aunque cambie quien vive ahí, la casa sigue teniendo historial.</p>
	{#if data.reincidentes.viviendas.length === 0}
		<p class="tarjeta mt-3 text-tinta/70">Ninguna vivienda tiene dos confirmadas en el año.</p>
	{:else}
		<ul class="mt-3 grid gap-3">
			{#each data.reincidentes.viviendas as casa (casa.id)}
				<li>
					<a class="tarjeta block hover:border-pino/40" href={`/panel/viviendas/${casa.id}`}>
						<p class="font-semibold">{casa.direccion}</p>
						<p class="mt-1 text-sm text-tinta/70">
							{casa.en365} confirmadas en el año
							{#if casa.habitantes.length > 0}
								· Habita: {casa.habitantes.join(', ')}
							{/if}
						</p>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
