<script lang="ts">
	import FilaIncidencia from '$lib/components/FilaIncidencia.svelte';
	import { RELACIONES } from '$lib/catalogo';
	import { fecha, nombrePeriodo, pesos } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const vivienda = $derived(data.vivienda);
</script>

<svelte:head>
	<title>{vivienda.direccion} · Vienna</title>
</svelte:head>

<a class="text-sm font-semibold text-pino" href="/panel/viviendas">Volver a viviendas</a>
<h1 class="mt-2 text-2xl font-semibold tracking-tight">{vivienda.direccion}</h1>
<p class="mt-1 text-sm text-tinta/70">{vivienda.confirmadas} conductas confirmadas en el año · {vivienda.abiertas} por revisar</p>

{#if vivienda.esTitular && !vivienda.esHabitante}
	<p class="tarjeta mt-4 text-sm">
		No vives aquí. Quien habita la casa es otra persona, y las cuotas siguen a tu nombre.
	</p>
{/if}

<div class="mt-5 grid gap-4 md:grid-cols-2">
	<section class="tarjeta">
		<h2 class="font-semibold">Dueños</h2>
		{#if vivienda.duenos.length === 0}
			<p class="mt-2 text-sm text-tinta/70">Sin dueño registrado.</p>
		{:else}
			<ul class="mt-3 space-y-3">
				{#each vivienda.duenos as persona (persona.id)}
					<li>
						<p class="font-semibold">{persona.nombre}</p>
						<p class="text-sm text-tinta/70">Desde {fecha(persona.desde)}</p>
						{#if persona.telefono}
							<p class="text-sm">{persona.telefono}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
	<section class="tarjeta">
		<h2 class="font-semibold">Quien habita</h2>
		{#if vivienda.habitantes.length === 0}
			<p class="mt-2 text-sm text-tinta/70">Nadie registrado como habitante.</p>
		{:else}
			<ul class="mt-3 space-y-3">
				{#each vivienda.habitantes as persona (persona.id)}
					<li>
						<p class="font-semibold">{persona.nombre}</p>
						<p class="text-sm text-tinta/70">
							{RELACIONES[persona.relacion] ?? persona.relacion} · desde {fecha(persona.desde)}
						</p>
						{#if persona.telefono}
							<p class="text-sm">{persona.telefono}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

{#if vivienda.cuotas.length > 0}
	<section class="mt-6">
		<h2 class="text-lg font-semibold">Cuotas</h2>
		<ul class="mt-3 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-tarjeta">
			{#each vivienda.cuotas as cuota (cuota.id)}
				<li class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
					<span>
						<span class="font-semibold">{nombrePeriodo(cuota.periodo)}</span>
						<span class="text-tinta/60"> · vence {fecha(cuota.vencimiento)}</span>
					</span>
					<span class={cuota.saldo > 0 ? 'font-semibold text-amber-900' : 'text-pino'}>
						{cuota.saldo > 0 ? `Saldo ${pesos(cuota.saldo)}` : 'Pagada'}
					</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mt-6">
	<div class="mb-3 flex items-center justify-between gap-3">
		<h2 class="text-lg font-semibold">Incidencias</h2>
		<a class="btn" href="/panel/incidencias/nueva">Registrar</a>
	</div>
	{#if vivienda.incidencias.length === 0}
		<p class="tarjeta text-tinta/70">Esta vivienda no tiene incidencias.</p>
	{:else}
		<div class="grid gap-3">
			{#each vivienda.incidencias as item (item.id)}
				<FilaIncidencia {item} />
			{/each}
		</div>
	{/if}
</section>
