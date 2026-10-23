<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Sin fraccionamiento · Vienna</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
	<p class="text-sm font-semibold text-pino">Vienna</p>
	<h1 class="mt-2 text-3xl font-semibold tracking-tight">Esta cuenta aún no está en un fraccionamiento.</h1>
	<p class="mt-4 text-tinta/75">
		Entraste con Google como <span class="font-semibold">{data.correo}</span>. Administración tiene que darte de alta
		con ese mismo correo, como dueño o como habitante.
	</p>
	<form method="POST" action="/salir" class="mt-6">
		<button class="btn" type="submit">Salir</button>
	</form>
</main>
