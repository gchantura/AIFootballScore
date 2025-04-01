<script>
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
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

<Table>
	<caption
		class="bg-white p-5 text-left text-lg font-semibold text-gray-900 dark:bg-gray-800 dark:text-white"
	>
		{competitionName} Standings
	</caption>
	<TableHead>
		<TableHeadCell>Pos</TableHeadCell>
		<TableHeadCell>Team</TableHeadCell>
		<TableHeadCell>P</TableHeadCell>
		<TableHeadCell>W</TableHeadCell>
		<TableHeadCell>D</TableHeadCell>
		<TableHeadCell>L</TableHeadCell>
		<TableHeadCell>GF</TableHeadCell>
		<TableHeadCell>GA</TableHeadCell>
		<TableHeadCell>GD</TableHeadCell>
		<TableHeadCell>Pts</TableHeadCell>
	</TableHead>
	{#if loading}
		<TableBody>
			<TableBodyRow>
				<TableBodyCell colspan="10" class="text-center">Loading...</TableBodyCell>
			</TableBodyRow>
		</TableBody>
	{:else if error}
		<TableBody>
			<TableBodyRow>
				<TableBodyCell colspan="10" class="text-center text-red-500">{error}</TableBodyCell>
			</TableBodyRow>
		</TableBody>
	{:else if standingsData && standingsData.standings}
		<TableBody>
			{#each standingsData.standings as team}
				<TableBodyRow>
					<TableBodyCell>{team.position}</TableBodyCell>
					<TableBodyCell>
						<div class="flex items-center">
							<img src={team.teamLogo} alt={team.teamName} class="mr-2 h-5 w-5" />
							<span class="truncate">{team.teamName}</span>
						</div>
					</TableBodyCell>
					<TableBodyCell>{team.playedGames}</TableBodyCell>
					<TableBodyCell>{team.won}</TableBodyCell>
					<TableBodyCell>{team.draw}</TableBodyCell>
					<TableBodyCell>{team.lost}</TableBodyCell>
					<TableBodyCell>{team.goalsFor}</TableBodyCell>
					<TableBodyCell>{team.goalsAgainst}</TableBodyCell>
					<TableBodyCell>{team.goalDifference}</TableBodyCell>
					<TableBodyCell class="font-bold">{team.points}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	{:else}
		<TableBody>
			<TableBodyRow>
				<TableBodyCell colspan="10" class="text-center text-gray-500"
					>No standings data available</TableBodyCell
				>
			</TableBodyRow>
		</TableBody>
	{/if}
</Table>
