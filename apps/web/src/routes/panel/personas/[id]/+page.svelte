<script lang="ts">
	import { CATEGORIAS, RELACIONES, ROLES, nombreDe, textoNivel } from '$lib/catalogo';
	import { fechaHora } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const persona = $derived(data.persona);
</script>

<svelte:head>
	<title>{persona.nombre} · Vienna</title>
</svelte:head>

<a class="text-sm font-semibold text-pino" href="/panel/personas">Volver a personas</a>
<h1 class="mt-2 text-2xl font-semibold tracking-tight">{persona.nombre}</h1>
<p class="mt-1 text-sm text-tinta/70">{persona.roles.map((rol) => ROLES[rol] ?? rol).join(' · ')}</p>
<p class="mt-3 text-sm">
	{#if persona.telefono}{persona.telefono} · {/if}{persona.correo}
</p>

<p class="tarjeta mt-4 text-sm">
	<span class="font-semibold">{textoNivel(persona.nivel)}</span>
	· {persona.en90} confirmadas en 90 días · {persona.en365} en el año
</p>

{#if persona.lugares.length > 0}
	<section class="mt-5">
		<h2 class="font-semibold">Viviendas</h2>
		<ul class="mt-2 space-y-2">
			{#each persona.lugares as lugar (lugar.id)}
				<li>
					<a class="font-semibold text-pino" href={`/panel/viviendas/${lugar.id}`}>
						{lugar.direccion}
					</a>
					<span class="text-sm text-tinta/70"> · {RELACIONES[lugar.vinculo] ?? lugar.vinculo}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if persona.porCategoria.length > 0}
	<section class="mt-5">
		<h2 class="font-semibold">Conductas confirmadas</h2>
		<ul class="mt-2 flex flex-wrap gap-2">
			{#each persona.porCategoria as grupo (grupo.categoria)}
				<li class="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-linea">
					{nombreDe(CATEGORIAS, grupo.categoria)} · {grupo.total}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mt-6">
	<h2 class="font-semibold">Incidencias en las que quedó ligado</h2>
	{#if persona.incidencias.length === 0}
		<p class="mt-2 text-sm text-tinta/70">Todavía no hay una incidencia confirmada a su nombre.</p>
	{:else}
		<ul class="mt-3 grid gap-2">
			{#each persona.incidencias as item (item.id)}
				<li>
					<a class="tarjeta block hover:border-pino/40" href={`/panel/incidencias/${item.id}`}>
						<p class="font-semibold">{nombreDe(CATEGORIAS, item.categoria)}</p>
						<p class="text-sm text-tinta/70">{item.direccion} · {fechaHora(item.ocurrioEn)}</p>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
