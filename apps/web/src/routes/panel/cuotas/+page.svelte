<script lang="ts">
	import { enhance } from '$app/forms';
	import { fecha, nombrePeriodo, pesos } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const pendientes = $derived(data.cuotas.filter((cuota) => cuota.saldo > 0));
</script>

<svelte:head>
	<title>Cuotas · {data.fraccionamiento.nombre}</title>
</svelte:head>

<h1 class="text-2xl font-semibold tracking-tight">Cuotas</h1>
<p class="mt-2 max-w-2xl text-sm text-tinta/70">
	La cuota de mantenimiento es del dueño, viva o no en el fraccionamiento. El saldo de esta vista es {pesos(data.saldo)}.
</p>

{#if form?.error}
	<p class="mt-4 text-sm font-semibold text-rose-800">{form.error}</p>
{/if}
{#if form?.ok}
	<p class="mt-4 text-sm font-semibold text-pino">{form.ok}</p>
{/if}

{#if data.esAdmin && pendientes.length > 0}
	<form method="POST" action="?/pagar" class="tarjeta mt-5 grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto] md:items-end" use:enhance>
		<label>
			<span class="mb-1 block text-sm font-semibold">Cuota con saldo</span>
			<select class="campo" name="cuotaId" required>
				{#each pendientes as cuota (cuota.id)}
					<option value={cuota.id}>
						{cuota.direccion} · {nombrePeriodo(cuota.periodo)} · {pesos(cuota.saldo)}
					</option>
				{/each}
			</select>
		</label>
		<label>
			<span class="mb-1 block text-sm font-semibold">Monto</span>
			<input class="campo" name="monto" inputmode="decimal" placeholder="1850" required />
		</label>
		<label>
			<span class="mb-1 block text-sm font-semibold">Fecha</span>
			<input class="campo" type="date" name="pagadoEn" value={data.hoy} required />
		</label>
		<button class="btn" type="submit">Registrar pago</button>
	</form>
{/if}

<div class="mt-5 overflow-x-auto rounded-2xl border border-linea bg-tarjeta">
	<table class="w-full min-w-[640px] text-left text-sm">
		<thead class="border-b border-linea text-tinta/60">
			<tr>
				<th class="px-4 py-3 font-semibold">Vivienda</th>
				<th class="px-4 py-3 font-semibold">Periodo</th>
				<th class="px-4 py-3 font-semibold">Vence</th>
				<th class="px-4 py-3 font-semibold">Cuota</th>
				<th class="px-4 py-3 font-semibold">Saldo</th>
			</tr>
		</thead>
		<tbody>
			{#each data.cuotas as cuota (cuota.id)}
				<tr class="border-b border-linea last:border-0">
					<td class="px-4 py-3">
						<a class="font-semibold text-pino" href={`/panel/viviendas/${cuota.viviendaId}`}>{cuota.direccion}</a>
						<span class="block text-tinta/60">{cuota.concepto}</span>
					</td>
					<td class="px-4 py-3 capitalize">{nombrePeriodo(cuota.periodo)}</td>
					<td class="px-4 py-3">{fecha(cuota.vencimiento)}</td>
					<td class="px-4 py-3">{pesos(cuota.montoCentavos)}</td>
					<td class="px-4 py-3">
						{#if cuota.saldo === 0}
							<span class="font-semibold text-pino">Pagada</span>
						{:else}
							<span class={cuota.vencida ? 'font-semibold text-rose-900' : 'font-semibold'}>{pesos(cuota.saldo)}</span>
							{#if cuota.vencida}
								<span class="block text-xs text-rose-900">Vencida</span>
							{/if}
						{/if}
					</td>
				</tr>
			{:else}
				<tr>
					<td class="px-4 py-6 text-tinta/70" colspan="5">No hay cuotas en esta vista.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if data.esAdmin}
	<form method="POST" action="?/generar" class="tarjeta mt-6 grid gap-3 md:grid-cols-2" use:enhance>
		<h2 class="font-semibold md:col-span-2">Generar la cuota del mes</h2>
		<p class="text-sm text-tinta/70 md:col-span-2">Se crea una por vivienda. Si ese mes ya existe, no se duplica.</p>
		<label>
			<span class="mb-1 block text-sm font-semibold">Concepto</span>
			<input class="campo" name="concepto" value="Cuota de mantenimiento" required />
		</label>
		<label>
			<span class="mb-1 block text-sm font-semibold">Monto en pesos</span>
			<input class="campo" name="monto" inputmode="decimal" placeholder="1850" required />
		</label>
		<label>
			<span class="mb-1 block text-sm font-semibold">Mes</span>
			<input class="campo" type="month" name="periodo" value="2026-11" required />
		</label>
		<label>
			<span class="mb-1 block text-sm font-semibold">Vencimiento</span>
			<input class="campo" type="date" name="vencimiento" value="2026-11-10" required />
		</label>
		<button class="btn w-fit" type="submit">Generar</button>
	</form>
{/if}
