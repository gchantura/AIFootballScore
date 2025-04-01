import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
    const competitionCode = url.searchParams.get('competition');
    const limit = url.searchParams.get('limit') || 10;

    if (!API_KEY) {
        return json({ error: 'Missing API key' }, { status: 400 });
    }

    if (!competitionCode) {
        return json({ error: 'Competition code is required' }, { status: 400 });
    }

    const API_URL = `https://api.football-data.org/v4/competitions/${competitionCode}/scorers?limit=${limit}`;

    try {
        const response = await fetch(API_URL, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (!response.ok) {
            return json({
                error: 'Failed to fetch scorers data',
                status: response.status,
                details: await response.text()
            }, { status: response.status });
        }

        const data = await response.json();

        // Extract and format the scorers data
        const formattedScorers = data.scorers.map(scorer => ({
            playerId: scorer.player.id,
            playerName: scorer.player.name,
            nationality: scorer.player.nationality,
            position: scorer.player.position,
            teamId: scorer.team.id,
            teamName: scorer.team.name,
            teamLogo: scorer.team.crest,
            goals: scorer.goals,
            assists: scorer.assists || 0,
            penalties: scorer.penalties || 0
        }));

        return json({
            competition: data.competition.name,
            season: data.season,
            scorers: formattedScorers
        });
    } catch (error) {
        return json({
            error: 'Server error fetching scorers',
            details: error.message
        }, { status: 500 });
    }
}