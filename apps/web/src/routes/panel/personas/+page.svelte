<script lang="ts">
	import { ROLES, textoNivel } from '$lib/catalogo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Personas · {data.fraccionamiento.nombre}</title>
</svelte:head>

<h1 class="text-2xl font-semibold tracking-tight">Personas</h1>
<p class="mt-2 max-w-2xl text-sm text-tinta/70">
	Dueños, habitantes, comité y administración de este fraccionamiento. El teléfono no se muestra en las cuentas de vecinos.
</p>

<ul class="mt-5 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-tarjeta">
	{#each data.personas as persona (persona.id)}
		<li>
			<a class="block px-4 py-3 hover:bg-papel" href={`/panel/personas/${persona.id}`}>
				<span class="flex flex-wrap items-baseline justify-between gap-2">
					<span class="font-semibold">{persona.nombre}</span>
					{#if persona.nivel}
						<span class="text-sm font-semibold">{textoNivel(persona.nivel)}</span>
					{/if}
				</span>
				<span class="mt-1 block text-sm text-tinta/70">
					{persona.roles.map((rol) => ROLES[rol] ?? rol).join(' · ')}
					{#if persona.telefono}
						· {persona.telefono}
					{/if}
				</span>
				{#if persona.lugares.length > 0}
					<span class="mt-1 block text-sm text-tinta/60">{persona.lugares.join(' · ')}</span>
				{/if}
			</a>
		</li>
	{/each}
</ul>
