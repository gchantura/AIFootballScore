<!-- src/components/TeamForm.svelte -->
<script>
	export const teamId = '';
	export let teamName = '';

	import { onMount } from 'svelte';

	let formData = null;
	let loading = true;
	let error = null;

	// Function to get color based on result
	function getResultColor(result) {
		switch (result) {
			case 'W':
				return 'bg-green-500';
			case 'L':
				return 'bg-red-500';
			case 'D':
				return 'bg-gray-500';
			default:
				return 'bg-gray-300';
		}
	}

	onMount(async () => {
		try {
			// Only use teamName since that's what we reliably have
			const queryParam = `teamName=${encodeURIComponent(teamName)}`;
			const response = await fetch(`/api/team-form?${queryParam}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch team form');
			}

			formData = await response.json();
			loading = false;
		} catch (err) {
			console.error('TeamForm error:', err);
			error = err.message;
			loading = false;
		}
	});
</script>

<div class="team-form">
	<h3 class="mb-1 text-sm font-semibold">{teamName} - Last 5 matches</h3>

	{#if loading}
		<div class="flex justify-center">
			<div class="flex animate-pulse space-x-1">
				{#each Array(5) as _}
					<div class="h-6 w-6 rounded-full bg-gray-200"></div>
				{/each}
			</div>
		</div>
	{:else if error}
		<p class="text-xs text-red-500">{error}</p>
	{:else if formData && formData.form && formData.form.length > 0}
		<!-- Simple results display -->
		<div class="mb-2 flex space-x-1">
			{#each formData.form as match}
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white {getResultColor(
						match.result
					)}"
					title="{match.home ? 'vs' : '@'} {match.opponent}: {match.score}"
				>
					{match.result}
				</div>
			{/each}
		</div>

		<!-- Detailed matches display -->
		<div class="space-y-1 text-left text-xs">
			{#each formData.form as match}
				<div class="flex items-center">
					<div
						class="h-5 w-5 {getResultColor(
							match.result
						)} mr-2 flex items-center justify-center rounded-full text-white"
					>
						{match.result}
					</div>
					<div class="truncate">
						{match.home ? 'vs' : '@'}
						{match.opponent} ({match.score})
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-xs text-gray-500">No recent matches found</p>
	{/if}
</div>
