<script>
	export let competitionCode;
	export let competitionName;

	import { onMount } from 'svelte';

	let standingsData = null;
	let loading = true;
	let error = null;

	onMount(async () => {
		try {
			const response = await fetch(`/api/standings?competition=${competitionCode}`);
			if (!response.ok) throw new Error('Failed to fetch standings');
			standingsData = await response.json();
			loading = false;
		} catch (err) {
			error = err.message;
			loading = false;
		}
	});
</script>

<div class="league-standings">
	<h3 class="mb-2 text-lg font-semibold">{competitionName} Standings</h3>

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
	{:else if standingsData && standingsData.standings}
		<div class="overflow-x-auto">
			<table class="min-w-full bg-white">
				<thead>
					<tr class="bg-gray-100 text-xs text-gray-600 uppercase">
						<th class="px-2 py-3 text-left">Pos</th>
						<th class="px-2 py-3 text-left">Team</th>
						<th class="px-2 py-3 text-right">P</th>
						<th class="px-2 py-3 text-right">W</th>
						<th class="px-2 py-3 text-right">D</th>
						<th class="px-2 py-3 text-right">L</th>
						<th class="px-2 py-3 text-right">GF</th>
						<th class="px-2 py-3 text-right">GA</th>
						<th class="px-2 py-3 text-right">GD</th>
						<th class="px-2 py-3 text-right">Pts</th>
					</tr>
				</thead>
				<tbody class="text-sm">
					{#each standingsData.standings as team}
						<tr class="border-b hover:bg-gray-50">
							<td class="px-2 py-2 text-left">{team.position}</td>
							<td class="px-2 py-2 text-left">
								<div class="flex items-center">
									<img src={team.teamLogo} alt={team.teamName} class="mr-2 h-5 w-5" />
									<span class="truncate">{team.teamName}</span>
								</div>
							</td>
							<td class="px-2 py-2 text-right">{team.playedGames}</td>
							<td class="px-2 py-2 text-right">{team.won}</td>
							<td class="px-2 py-2 text-right">{team.draw}</td>
							<td class="px-2 py-2 text-right">{team.lost}</td>
							<td class="px-2 py-2 text-right">{team.goalsFor}</td>
							<td class="px-2 py-2 text-right">{team.goalsAgainst}</td>
							<td class="px-2 py-2 text-right">{team.goalDifference}</td>
							<td class="px-2 py-2 text-right font-bold">{team.points}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p class="text-gray-500">No standings data available</p>
	{/if}
</div>
