<script lang="ts">
	import { page } from '$app/state';
	import { ROLES } from '$lib/catalogo';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	function activo(href: string) {
		if (href === '/panel') return page.url.pathname === '/panel';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="min-h-screen md:grid md:grid-cols-[240px_1fr]">
	<aside class="border-b border-linea bg-tarjeta md:border-r md:border-b-0">
		<div class="flex items-center justify-between gap-3 px-4 py-4 md:block">
			<div>
				<a href="/panel" class="text-lg font-semibold">Vienna</a>
				<p class="text-sm text-tinta/70">{data.fraccionamiento.nombre}</p>
			</div>
			<form method="POST" action="/salir" class="md:hidden">
				<button class="text-sm font-semibold text-tinta/70" type="submit">Salir</button>
			</form>
		</div>
		<nav class="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible" aria-label="Secciones">
			{#each data.nav as item (item.href)}
				<a
					href={item.href}
					class={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${activo(item.href) ? 'bg-pino text-white' : 'hover:bg-papel'}`}
					aria-current={activo(item.href) ? 'page' : undefined}
				>
					{item.etiqueta}
				</a>
			{/each}
		</nav>
	</aside>

	<div class="min-w-0">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-linea px-5 py-4">
			<div>
				<p class="font-semibold">{data.fraccionamiento.nombre}</p>
				<p class="text-sm text-tinta/70">
					{data.fraccionamiento.ciudad}, {data.fraccionamiento.estado}
					· {data.roles.map((rol) => ROLES[rol] ?? rol).join(' · ')}
				</p>
			</div>
			<div class="flex items-center gap-3">
				{#if data.membresias.length > 1}
					<form method="POST" action="/panel/cambiar" class="flex items-center gap-2">
						<label>
							<span class="sr-only">Fraccionamiento</span>
							<select
								class="campo w-auto"
								name="fraccionamientoId"
								onchange={(event) => event.currentTarget.form?.requestSubmit()}
							>
								{#each data.membresias as membresia (membresia.fraccionamientoId)}
									<option
										value={membresia.fraccionamientoId}
										selected={membresia.fraccionamientoId === data.fraccionamiento.id}
									>
										{membresia.nombre}
									</option>
								{/each}
							</select>
						</label>
					</form>
				{/if}
				<div class="hidden text-right md:block">
					<p class="text-sm font-semibold">{data.usuario.nombre}</p>
					<form method="POST" action="/salir">
						<button class="text-sm text-tinta/60 hover:text-tinta" type="submit">Salir</button>
					</form>
				</div>
			</div>
		</header>
		<main id="contenido" class="mx-auto max-w-5xl px-5 py-6">
			{@render children()}
		</main>
	</div>
</div>
