<script lang="ts">
	import { enhance } from '$app/forms';
	import { CATEGORIAS, GRAVEDADES } from '$lib/catalogo';
	import { ahoraMexicoLocal } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const maximo = ahoraMexicoLocal();
</script>

<svelte:head>
	<title>Registrar incidencia · Vienna</title>
</svelte:head>

<a class="text-sm font-semibold text-pino" href="/panel/incidencias">Volver a incidencias</a>
<h1 class="mt-2 text-2xl font-semibold tracking-tight">Registrar una conducta</h1>
<p class="mt-2 max-w-2xl text-sm text-tinta/70">
	Describe el hecho, la vivienda y la hora. Queda como reporte hasta que administración o comité lo confirmen. No elijas
	a la persona: eso lo hace quien revisa.
</p>

<form method="POST" class="tarjeta mt-5 max-w-2xl space-y-4" use:enhance>
	<label class="block">
		<span class="mb-1 block text-sm font-semibold">Vivienda</span>
		<select class="campo" name="viviendaId" required>
			<option value="">Elige una vivienda</option>
			{#each data.viviendas as vivienda (vivienda.id)}
				<option value={vivienda.id} selected={form?.valores?.viviendaId === vivienda.id}>{vivienda.direccion}</option>
			{/each}
		</select>
	</label>
	<div class="grid gap-4 sm:grid-cols-2">
		<label class="block">
			<span class="mb-1 block text-sm font-semibold">Conducta</span>
			<select class="campo" name="categoria" required>
				<option value="">Elige</option>
				{#each CATEGORIAS as categoria (categoria.id)}
					<option value={categoria.id} selected={form?.valores?.categoria === categoria.id}>{categoria.nombre}</option>
				{/each}
			</select>
		</label>
		<label class="block">
			<span class="mb-1 block text-sm font-semibold">Gravedad</span>
			<select class="campo" name="gravedad" required>
				<option value="">Elige</option>
				{#each GRAVEDADES as gravedad (gravedad.id)}
					<option value={gravedad.id} selected={form?.valores?.gravedad === gravedad.id}>{gravedad.nombre}</option>
				{/each}
			</select>
		</label>
	</div>
	<label class="block">
		<span class="mb-1 block text-sm font-semibold">Fecha y hora en que ocurrió</span>
		<input class="campo" type="datetime-local" name="ocurrioEn" required max={maximo} value={form?.valores?.ocurrioEn ?? ''} />
	</label>
	<label class="block">
		<span class="mb-1 block text-sm font-semibold">Qué pasó</span>
		<textarea class="campo min-h-32" name="descripcion" required minlength="15" maxlength="2000"
			>{form?.valores?.descripcion ?? ''}</textarea
		>
	</label>
	{#if form?.error}
		<p class="text-sm font-semibold text-rose-800">{form.error}</p>
	{/if}
	<button class="btn" type="submit">Enviar reporte</button>
</form>
