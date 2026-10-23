<script lang="ts">
	import FilaIncidencia from '$lib/components/FilaIncidencia.svelte';
	import { CATEGORIAS, ESTADOS } from '$lib/catalogo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const estados = [{ id: 'por_revisar', nombre: 'Por revisar' }, ...ESTADOS];
</script>

<svelte:head>
	<title>Incidencias · {data.fraccionamiento.nombre}</title>
</svelte:head>

<header class="mb-5 flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Incidencias</h1>
		<p class="mt-1 text-sm text-tinta/70">
			{data.esComite ? 'Todas las de este fraccionamiento.' : 'Las de tus viviendas y las que tú registraste.'}
		</p>
	</div>
	<a class="btn" href="/panel/incidencias/nueva">Registrar</a>
</header>

<form method="GET" class="mb-5 flex flex-wrap items-end gap-2">
	<label>
		<span class="mb-1 block text-sm font-semibold">Estado</span>
		<select class="campo w-auto" name="estado">
			<option value="">Todos</option>
			{#each estados as estado (estado.id)}
				<option value={estado.id} selected={data.estado === estado.id}>{estado.nombre}</option>
			{/each}
		</select>
	</label>
	<label>
		<span class="mb-1 block text-sm font-semibold">Conducta</span>
		<select class="campo w-auto" name="categoria">
			<option value="">Todas</option>
			{#each CATEGORIAS as categoria (categoria.id)}
				<option value={categoria.id} selected={data.categoria === categoria.id}>{categoria.nombre}</option>
			{/each}
		</select>
	</label>
	<button class="btn-sec" type="submit">Filtrar</button>
	{#if data.estado || data.categoria}
		<a class="px-2 text-sm font-semibold text-pino" href="/panel/incidencias">Limpiar</a>
	{/if}
</form>

{#if data.incidencias.length === 0}
	<p class="tarjeta text-tinta/70">No hay incidencias con este filtro.</p>
{:else}
	<div class="grid gap-3">
		{#each data.incidencias as item (item.id)}
			<FilaIncidencia {item} />
		{/each}
	</div>
{/if}
