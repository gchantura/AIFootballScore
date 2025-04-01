<script>
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, DarkMode } from 'flowbite-svelte';
</script>

<Navbar color="form">
	<NavBrand href="/">
		<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
			>AI Football Score</span
		>
	</NavBrand>
	<NavHamburger />
	<NavUl>
		<NavLi href="/" active={true}>Home</NavLi>
		<NavLi href="./Standing.svelte">Standing</NavLi>
		<NavLi href="/docs/components/navbar">Navbar</NavLi>
		<NavLi href="/pricing">Pricing</NavLi>
		<NavLi href="/contact">Contact</NavLi>
	</NavUl>
	<DarkMode />
</Navbar>
