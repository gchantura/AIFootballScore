<script>
	import '../app.css';
	import Navbar from '../components/Navbar/Navbar.svelte';

	let { children } = $props();
</script>

<Navbar />
{@render children()}
