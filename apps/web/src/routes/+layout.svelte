<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Vienna</title>
</svelte:head>

{@render children()}
