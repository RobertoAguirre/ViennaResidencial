<script lang="ts">
	import { enhance } from '$app/forms';
	import Pildora from '$lib/components/Pildora.svelte';
	import { CATEGORIAS, GRAVEDADES, RELACIONES, nombreDe } from '$lib/catalogo';
	import { fechaHora } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const incidencia = $derived(data.incidencia);
</script>

<svelte:head>
	<title>{nombreDe(CATEGORIAS, incidencia.categoria)} · Vienna</title>
</svelte:head>

<a class="text-sm font-semibold text-pino" href="/panel/incidencias">Volver a incidencias</a>

<article class="mt-3">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{nombreDe(CATEGORIAS, incidencia.categoria)}</h1>
			<p class="mt-1 text-tinta/70">
				<a class="font-semibold text-pino" href={`/panel/viviendas/${incidencia.viviendaId}`}>{incidencia.direccion}</a>
				· {nombreDe(GRAVEDADES, incidencia.gravedad)}
			</p>
		</div>
		<Pildora estado={incidencia.estado} />
	</div>

	<dl class="tarjeta mt-5 space-y-3">
		<div>
			<dt class="text-sm font-semibold text-tinta/60">Cuándo ocurrió</dt>
			<dd>{fechaHora(incidencia.ocurrioEn)}</dd>
		</div>
		<div>
			<dt class="text-sm font-semibold text-tinta/60">Qué se reportó</dt>
			<dd class="whitespace-pre-wrap">{incidencia.descripcion}</dd>
		</div>
		<div>
			<dt class="text-sm font-semibold text-tinta/60">Registro</dt>
			<dd>
				{fechaHora(incidencia.creadaEn)}
				{#if incidencia.propia}
					· Tú la registraste
				{:else if incidencia.reportante}
					· {incidencia.reportante}
				{/if}
			</dd>
		</div>
		{#if incidencia.respuesta}
			<div>
				<dt class="text-sm font-semibold text-tinta/60">Respuesta del comité</dt>
				<dd class="whitespace-pre-wrap">{incidencia.respuesta}</dd>
			</div>
		{/if}
		{#if incidencia.notasInternas}
			<div>
				<dt class="text-sm font-semibold text-tinta/60">Notas internas</dt>
				<dd class="whitespace-pre-wrap">{incidencia.notasInternas}</dd>
			</div>
		{/if}
	</dl>

	{#if incidencia.implicados.length > 0}
		<section class="mt-5">
			<h2 class="font-semibold">Personas ligadas al confirmar</h2>
			<ul class="mt-2 flex flex-wrap gap-2">
				{#each incidencia.implicados as persona (persona.id)}
					<li class="rounded-full bg-white px-3 py-1 text-sm font-semibold ring-1 ring-linea">
						{#if data.esComite}
							<a href={`/panel/personas/${persona.id}`}>{persona.nombre}</a>
						{:else}
							{persona.nombre}
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if incidencia.puedeResolver}
		<form method="POST" class="tarjeta mt-5 space-y-4" use:enhance>
			<h2 class="font-semibold">Revisión</h2>
			{#if incidencia.ocupantes.length === 0}
				<p class="text-sm text-tinta/70">No hay un habitante registrado. Si la confirmas, queda solo en la vivienda.</p>
			{:else}
				<fieldset>
					<legend class="text-sm font-semibold">¿Quién está ligado a esta conducta?</legend>
					<p class="mt-1 text-sm text-tinta/70">
						Marca solo a quien corresponda. Si no marcas a nadie, la incidencia suma a la vivienda y no a una persona.
					</p>
					<div class="mt-3 space-y-2">
						{#each incidencia.ocupantes as persona (persona.id)}
							<label class="flex items-center gap-2">
								<input type="checkbox" name="implicado" value={persona.id} />
								<span>
									{persona.nombre}
									<span class="text-tinta/60">· {RELACIONES[persona.relacion] ?? persona.relacion}</span>
									{#if persona.telefono}
										<span class="text-tinta/60">· {persona.telefono}</span>
									{/if}
								</span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/if}
			<label class="block">
				<span class="mb-1 block text-sm font-semibold">Respuesta para quien reportó</span>
				<textarea class="campo min-h-24" name="respuesta" maxlength="1000"></textarea>
			</label>
			<label class="block">
				<span class="mb-1 block text-sm font-semibold">Notas internas</span>
				<textarea class="campo min-h-20" name="notas" maxlength="1000">{incidencia.notasInternas ?? ''}</textarea>
			</label>
			{#if form?.error}
				<p class="text-sm font-semibold text-rose-800">{form.error}</p>
			{/if}
			<div class="flex flex-wrap gap-2">
				<button class="btn-sec" type="submit" formaction="?/revision">Dejar en revisión</button>
				<button class="btn" type="submit" formaction="?/confirmar">Confirmar</button>
				<button class="btn-peligro" type="submit" formaction="?/desestimar">Desestimar</button>
			</div>
		</form>
	{/if}

	{#if incidencia.sucesos.length > 0}
		<section class="mt-6">
			<h2 class="font-semibold">Seguimiento</h2>
			<ol class="mt-2 space-y-2 text-sm">
				{#each incidencia.sucesos as suceso, indice (indice)}
					<li class="rounded-lg bg-white px-3 py-2 ring-1 ring-linea">
						{suceso.nombre} · {suceso.accion}
						<span class="text-tinta/60"> · {fechaHora(suceso.creadoEn)}</span>
					</li>
				{/each}
			</ol>
		</section>
	{/if}
</article>
