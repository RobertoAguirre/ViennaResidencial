<script lang="ts">
	import { ESTADOS, nombreDe } from '$lib/catalogo';

	let { estado }: { estado: string } = $props();

	const clases: Record<string, string> = {
		reportada: 'bg-amber-100 text-amber-950',
		en_revision: 'bg-sky-100 text-sky-950',
		confirmada: 'bg-rose-100 text-rose-950',
		desestimada: 'bg-stone-200 text-stone-700'
	};
</script>

<span class={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${clases[estado] ?? 'bg-stone-100'}`}>
	{nombreDe(ESTADOS, estado)}
</span>
