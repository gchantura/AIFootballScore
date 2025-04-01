<!-- routes/Games/+page.svelte -->

<script>
	import { onMount } from 'svelte';
	import { AccordionItem, Accordion, Tabs, TabItem } from 'flowbite-svelte';
	import TeamForm from '../../components/TeamForm.svelte';
	import TopScorers from '../../components/TopScorers.svelte';
	import LeagueStandings from '../../components/LeagueStandings.svelte';
	import LeagueStandingsTable from '../../components/LeagueStandingsTable.svelte';

	let matches = [];
	let error = null;
	let leagues = {};

	// Map league codes
	const leagueCodes = {
		'Premier League': 'PL',
		'Primera Division': 'PD',
		Bundesliga: 'BL1',
		'Serie A': 'SA',
		'Ligue 1': 'FL1'
	};

	// Function to format date (DD.MM.YYYY)
	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Function to format time (H:mm)
	function formatTime(dateString) {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	// Function to get status color
	function getStatusColor(status) {
		switch (status) {
			case 'FINISHED':
				return 'text-gray-500';
			case 'IN_PLAY':
				return 'text-green-500 animate-pulse';
			case 'PAUSED':
				return 'text-yellow-500';
			case 'POSTPONED':
				return 'text-red-500';
			default:
				return 'text-blue-500';
		}
	}

	onMount(async () => {
		try {
			const response = await fetch('/api/matches');
			if (!response.ok) throw new Error('Failed to fetch data');
			matches = await response.json();

			// Group matches by competition
			leagues = matches.reduce((acc, match) => {
				const leagueName = match.competition;
				(acc[leagueName] = acc[leagueName] || []).push(match);
				return acc;
			}, {});
		} catch (err) {
			error = err.message;
		}
	});
	onMount(async () => {
		console.log('TeamForm mounted with:', { teamId, teamName });
		// rest of code
	});
</script>

<div class="container mx-auto p-4">
	{#if error}
		<p class="text-center text-red-500">{error}</p>
	{/if}

	{#each Object.keys(leagues) as league}
		<div class="mb-8">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">{league}</h2>
				<div class="flex space-x-2">
					<a href="#standings-{league}" class="text-sm text-blue-500 hover:underline">Standings</a>
					<a href="#scorers-{league}" class="text-sm text-blue-500 hover:underline">Top Scorers</a>
				</div>
			</div>

			<Accordion multiple class="mx-auto">
				{#each leagues[league] as match}
					<AccordionItem>
						<span slot="header" class="custom flex text-center">
							<div class="date-container mr-4 flex flex-col md:flex-row">
								<p class="match-date text-sm text-gray-600">{formatDate(match.date)}</p>
								<p class="match-time text-sm text-gray-600 md:ml-2">
									{formatTime(match.date)}
								</p>
							</div>
							<div class="teams-container flex w-full items-center justify-between">
								<div class="team flex items-center">
									<img
										src={match.homeTeamLogo}
										alt={match.homeTeam}
										class="team-logo mr-2 h-8 w-8"
									/>
									<p class="font-semibold">{match.homeTeam}</p>
								</div>

								{#if match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED'}
									<div class="score mx-4 text-lg font-bold">
										{match.score.home ?? 0} - {match.score.away ?? 0}
									</div>
								{:else}
									<div class="vs mx-4 text-gray-500">vs</div>
								{/if}

								<div class="team flex items-center">
									<p class="font-semibold">{match.awayTeam}</p>
									<img
										src={match.awayTeamLogo}
										alt={match.awayTeam}
										class="team-logo ml-2 h-8 w-8"
									/>
								</div>
								<div class="weather mt-2">
									{#if match.weather}
										<div class="weather-details text-sm">
											<p><strong>Temperature:</strong> {match.weather.temperature}°C</p>
											<p><strong>Conditions:</strong> {match.weather.description}</p>
											<p><strong>Humidity:</strong> {match.weather.humidity}%</p>
											<p><strong>Wind Speed:</strong> {match.weather.windSpeed} m/s</p>
										</div>
									{/if}
								</div>
							</div>
						</span>
						<div class="match-info p-4">
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="match-details">
									<h3 class="mb-2 text-lg font-semibold">Match Details</h3>
									<div class="grid grid-cols-2 gap-2 text-sm">
										<div class="label text-gray-500">Venue:</div>
										<div>{match.venue ?? 'Not specified'}</div>

										<div class="label text-gray-500">Matchday:</div>
										<div>{match.matchday}</div>

										<div class="label text-gray-500">Status:</div>
										<div class={getStatusColor(match.status)}>{match.status}</div>

										<div class="label text-gray-500">Referee:</div>
										<div>
											{match.referees && match.referees.length > 0
												? match.referees[0].name
												: 'Not assigned yet'}
										</div>

										{#if match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED'}
											<div class="label text-gray-500">Score:</div>
											<div class="font-bold">{match.score.home ?? 0} - {match.score.away ?? 0}</div>

											{#if match.score.halfTime && match.score.halfTime.home !== null}
												<div class="label text-gray-500">Half-time:</div>
												<div>{match.score.halfTime.home} - {match.score.halfTime.away}</div>
											{/if}

											{#if match.score.winner}
												<div class="label text-gray-500">Winner:</div>
												<div class="font-bold text-green-500">
													{match.score.winner === 'HOME_TEAM' ? match.homeTeam : match.awayTeam}
												</div>
											{/if}
										{/if}
									</div>
								</div>

								<div class="team-form space-y-4">
									<TeamForm teamId={match.homeTeam.id ?? ''} teamName={match.homeTeam} />
									<TeamForm teamId={match.awayTeam.id ?? ''} teamName={match.awayTeam} />
								</div>
							</div>

							{#if match.referees && match.referees.length > 1}
								<div class="mt-4">
									<h3 class="mb-2 text-lg font-semibold">Match Officials</h3>
									<div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
										{#each match.referees as referee}
											<div class="flex items-center">
												<span class="mr-2 text-gray-500">{referee.role}:</span>
												<span>{referee.name}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</AccordionItem>
				{/each}
			</Accordion>

			<div id="standings-{league}" class="mt-8">
				<LeagueStandingsTable
					competitionCode={leagueCodes[league] || ''}
					competitionName={league}
				/>
			</div>

			<div id="scorers-{league}" class="mt-8">
				<TopScorers
					competitionCode={leagueCodes[league] || ''}
					competitionName={league}
					limit={10}
				/>
			</div>
		</div>
	{/each}
</div>

<style>
	.custom {
		width: 100%;
		display: flex;
		align-items: center;
		text-align: start;
		padding: 0.5rem;
	}

	.date-container {
		min-width: 120px;
	}

	.team-logo {
		object-fit: contain;
	}

	@media (max-width: 640px) {
		.custom {
			flex-direction: column;
			align-items: flex-start;
		}

		.date-container {
			margin-bottom: 0.5rem;
		}

		.teams-container {
			width: 100%;
		}
	}
</style>
