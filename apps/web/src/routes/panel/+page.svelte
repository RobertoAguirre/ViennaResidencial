<script lang="ts">
	import FilaIncidencia from '$lib/components/FilaIncidencia.svelte';
	import { RELACIONES, textoNivel } from '$lib/catalogo';
	import { pesos } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const resumen = $derived(data.resumen);
</script>

<svelte:head>
	<title>Inicio · {data.fraccionamiento.nombre}</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-semibold tracking-tight">Hola, {data.usuario.nombre.split(' ')[0]}</h1>
	{#if data.esComite}
		<p class="mt-2 max-w-2xl text-tinta/75">
			Los reportes de este fraccionamiento no se publican entre vecinos. Aquí ves cuáles siguen abiertos y quién ya
			acumula conductas confirmadas.
		</p>
	{:else if data.esTitular && !data.viveAqui}
		<p class="mt-2 max-w-2xl text-tinta/75">
			No vives en {data.fraccionamiento.nombre}, pero las viviendas a tu nombre siguen siendo tu responsabilidad: las
			cuotas y las conductas de quien las habita.
		</p>
	{:else}
		<p class="mt-2 max-w-2xl text-tinta/75">
			Puedes registrar una conducta y seguir tus reportes. El expediente de otros vecinos no está en esta cuenta.
		</p>
	{/if}
</div>

{#if data.esComite}
	<div class="grid gap-3 sm:grid-cols-3">
		<a class="tarjeta" href="/panel/incidencias?estado=por_revisar">
			<p class="text-sm text-tinta/70">Por revisar</p>
			<p class="mt-1 text-3xl font-semibold">{resumen.porRevisar}</p>
		</a>
		<a class="tarjeta" href="/panel/reincidentes">
			<p class="text-sm text-tinta/70">Reincidentes</p>
			<p class="mt-1 text-3xl font-semibold">{resumen.reincidentes}</p>
		</a>
		<a class="tarjeta" href="/panel/cuotas">
			<p class="text-sm text-tinta/70">Cuotas vencidas</p>
			<p class="mt-1 text-3xl font-semibold">{resumen.cuotasVencidas}</p>
		</a>
	</div>

	{#if resumen.personas.length > 0}
		<section class="mt-8">
			<h2 class="text-lg font-semibold">Para ubicar primero</h2>
			<ul class="mt-3 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-tarjeta">
				{#each resumen.personas as persona (persona.id)}
					<li>
						<a class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-papel" href={`/panel/personas/${persona.id}`}>
							<span>
								<span class="font-semibold">{persona.nombre}</span>
								<span class="mt-0.5 block text-sm text-tinta/65">
									{persona.direccion ?? 'Sin vivienda de habitante'}
									{#if persona.relacion}
										· {RELACIONES[persona.relacion] ?? persona.relacion}
									{/if}
								</span>
							</span>
							<span class="text-right text-sm">
								<span class="block font-semibold">{textoNivel(persona.nivel)}</span>
								<span class="text-tinta/60">{persona.en90} en 90 días · {persona.en365} en el año</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

{#if resumen.viviendas.length > 0}
	<section class="mt-8">
		<h2 class="text-lg font-semibold">Tus viviendas</h2>
		<div class="mt-3 grid gap-3">
			{#each resumen.viviendas as casa (casa.id)}
				<a class="tarjeta block hover:border-pino/40" href={`/panel/viviendas/${casa.id}`}>
					<p class="font-semibold">{casa.direccion}</p>
					<p class="mt-1 text-sm text-tinta/70">
						{#if casa.esHabitante && casa.esTitular}
							Vives aquí y eres dueño
						{:else if casa.esTitular}
							Eres dueño y no vives aquí
						{:else}
							Vives aquí
						{/if}
						· {casa.abiertas} por revisar · {casa.confirmadas} confirmadas en el año
					</p>
					{#if casa.esTitular}
						<p class="mt-2 text-sm">Saldo de cuotas: {pesos(casa.saldo)}</p>
					{/if}
					{#if casa.habitantes.length > 0}
						<p class="mt-1 text-sm text-tinta/70">
							Habita: {casa.habitantes.map((persona) => persona.nombre).join(', ')}
						</p>
					{/if}
				</a>
			{/each}
		</div>
	</section>
{/if}

<section class="mt-8">
	<div class="mb-3 flex items-center justify-between gap-3">
		<h2 class="text-lg font-semibold">{data.esComite ? 'Incidencias recientes' : 'Incidencias de tus viviendas'}</h2>
		<a class="btn" href="/panel/incidencias/nueva">Registrar</a>
	</div>
	{#if resumen.recientes.length === 0}
		<p class="tarjeta text-tinta/70">No hay incidencias en esta vista.</p>
	{:else}
		<div class="grid gap-3">
			{#each resumen.recientes as item (item.id)}
				<FilaIncidencia {item} />
			{/each}
		</div>
	{/if}
</section>
