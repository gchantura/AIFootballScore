import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
    const competitionCode = url.searchParams.get('competition');

    if (!API_KEY) {
        return json({ error: 'Missing API key' }, { status: 400 });
    }

    if (!competitionCode) {
        return json({ error: 'Competition code is required' }, { status: 400 });
    }

    const API_URL = `https://api.football-data.org/v4/competitions/${competitionCode}/standings`;

    try {
        const response = await fetch(API_URL, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (!response.ok) {
            return json({
                error: 'Failed to fetch standings data',
                status: response.status,
                details: await response.text()
            }, { status: response.status });
        }

        const data = await response.json();

        // Extract and format the standings data
        const standings = data.standings.find(s => s.type === 'TOTAL')?.table || [];

        const formattedStandings = standings.map(team => ({
            position: team.position,
            teamId: team.team.id,
            teamName: team.team.name,
            teamLogo: team.team.crest,
            playedGames: team.playedGames,
            won: team.won,
            draw: team.draw,
            lost: team.lost,
            points: team.points,
            goalsFor: team.goalsFor,
            goalsAgainst: team.goalsAgainst,
            goalDifference: team.goalDifference,
            form: team.form
        }));

        return json({
            competition: data.competition.name,
            season: data.season,
            standings: formattedStandings
        });
    } catch (error) {
        return json({
            error: 'Server error fetching standings',
            details: error.message
        }, { status: 500 });
    }
}