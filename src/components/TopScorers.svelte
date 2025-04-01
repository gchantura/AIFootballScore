<script>
	export let competitionCode;
	export let competitionName;
	export let limit = 5;

	import { onMount } from 'svelte';

	let scorersData = null;
	let loading = true;
	let error = null;

	onMount(async () => {
		try {
			const response = await fetch(`/api/scorers?competition=${competitionCode}&limit=${limit}`);
			if (!response.ok) throw new Error('Failed to fetch scorers');
			scorersData = await response.json();
			loading = false;
		} catch (err) {
			error = err.message;
			loading = false;
		}
	});
</script>

<div class="top-scorers">
	<h3 class="mb-2 text-lg font-semibold">{competitionName} Top Scorers</h3>

	{#if loading}
		<div class="flex justify-center">
			<div class="w-full animate-pulse space-y-2">
				{#each Array(5) as _}
					<div class="h-8 rounded bg-gray-200"></div>
				{/each}
			</div>
		</div>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else if scorersData && scorersData.scorers}
		<div class="overflow-x-auto">
			<table class="min-w-full bg-white">
				<thead>
					<tr class="bg-gray-100 text-xs text-gray-600 uppercase">
						<th class="px-2 py-3 text-left">Rank</th>
						<th class="px-2 py-3 text-left">Player</th>
						<th class="px-2 py-3 text-left">Team</th>
						<th class="px-2 py-3 text-right">Goals</th>
						<th class="px-2 py-3 text-right">Assists</th>
						<th class="px-2 py-3 text-right">Penalties</th>
					</tr>
				</thead>
				<tbody class="text-sm">
					{#each scorersData.scorers as scorer, index}
						<tr class="border-b hover:bg-gray-50">
							<td class="px-2 py-2 text-left">{index + 1}</td>
							<td class="px-2 py-2 text-left">
								<div class="flex flex-col">
									<span>{scorer.playerName}</span>
									<span class="text-xs text-gray-500">{scorer.nationality}</span>
								</div>
							</td>
							<td class="px-2 py-2 text-left">
								<div class="flex items-center">
									<img src={scorer.teamLogo} alt={scorer.teamName} class="mr-2 h-5 w-5" />
									<span class="truncate">{scorer.teamName}</span>
								</div>
							</td>
							<td class="px-2 py-2 text-right font-bold">{scorer.goals}</td>
							<td class="px-2 py-2 text-right">{scorer.assists}</td>
							<td class="px-2 py-2 text-right">{scorer.penalties}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p class="text-gray-500">No scorers data available</p>
	{/if}
</div>
