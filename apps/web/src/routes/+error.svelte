<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
	<p class="text-sm text-tinta/60">{page.status}</p>
	<h1 class="mt-1 text-2xl font-semibold">No se pudo abrir esta página</h1>
	<p class="mt-3 text-tinta/80">{page.error?.message ?? 'Ocurrió un error al cargar la página.'}</p>
	<a class="btn mt-6 w-fit" href="/">Volver a entrar</a>
</main>
