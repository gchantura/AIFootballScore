//t

import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
    const teamId = url.searchParams.get('teamId');
    const teamName = url.searchParams.get('teamName');

    if (!API_KEY) {
        return json({ error: 'Missing API key' }, { status: 400 });
    }

    if (!teamId && !teamName) {
        return json({ error: 'Either Team ID or Team Name is required' }, { status: 400 });
    }

    try {
        let teamData;

        // Step 1: If we only have team name, we need to find the team ID first
        if (!teamId && teamName) {
            // First, we need to search for the team ID
            const teamSearchUrl = `https://api.football-data.org/v4/teams?limit=10`;
            const teamsResponse = await fetch(teamSearchUrl, {
                headers: { 'X-Auth-Token': API_KEY }
            });

            if (!teamsResponse.ok) {
                return json({
                    error: 'Failed to search for team',
                    status: teamsResponse.status,
                    details: await teamsResponse.text()
                }, { status: teamsResponse.status });
            }

            const teamsData = await teamsResponse.json();
            // Find the team with a name that matches or is close to the requested team name
            teamData = teamsData.teams.find(team =>
                team.name.toLowerCase() === teamName.toLowerCase() ||
                team.shortName?.toLowerCase() === teamName.toLowerCase() ||
                team.tla?.toLowerCase() === teamName.toLowerCase()
            );

            if (!teamData) {
                // As a fallback, try to find partial matches
                teamData = teamsData.teams.find(team =>
                    team.name.toLowerCase().includes(teamName.toLowerCase()) ||
                    teamName.toLowerCase().includes(team.name.toLowerCase())
                );
            }

            if (!teamData) {
                return json({
                    error: 'Team not found with the provided name',
                    details: 'Please try using a team ID instead'
                }, { status: 404 });
            }
        }

        const actualTeamId = teamId || teamData.id;

        // Get current date
        const today = new Date().toISOString().split("T")[0];

        // Get date 2 months ago to see the recent form
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const twoMonthsAgoFormatted = twoMonthsAgo.toISOString().split("T")[0];

        const API_URL = `https://api.football-data.org/v4/teams/${actualTeamId}/matches?dateFrom=${twoMonthsAgoFormatted}&dateTo=${today}&status=FINISHED`;

        const response = await fetch(API_URL, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (!response.ok) {
            return json({
                error: 'Failed to fetch team form data',
                status: response.status,
                details: await response.text()
            }, { status: response.status });
        }

        const data = await response.json();

        if (!data.matches || data.matches.length === 0) {
            return json({
                teamId: actualTeamId,
                teamName: teamName || (teamData ? teamData.name : "Unknown"),
                form: [],
                formString: ""
            });
        }

        // Process the matches to determine W/L/D
        const processedMatches = data.matches.map(match => {
            const isHomeTeam = match.homeTeam.id === parseInt(actualTeamId);
            const homeScore = match.score.fullTime.home;
            const awayScore = match.score.fullTime.away;

            let result;
            if (homeScore === awayScore) {
                result = 'D'; // Draw
            } else if ((isHomeTeam && homeScore > awayScore) || (!isHomeTeam && awayScore > homeScore)) {
                result = 'W'; // Win
            } else {
                result = 'L'; // Loss
            }

            return {
                matchId: match.id,
                competition: match.competition.name,
                date: match.utcDate,
                opponent: isHomeTeam ? match.awayTeam.name : match.homeTeam.name,
                opponentLogo: isHomeTeam ? match.awayTeam.crest : match.homeTeam.crest,
                home: isHomeTeam,
                result: result,
                score: `${match.score.fullTime.home} - ${match.score.fullTime.away}`
            };
        });

        // Sort by date (most recent first)
        processedMatches.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Get the last 5 matches
        const lastFiveMatches = processedMatches.slice(0, 5);

        return json({
            teamId: actualTeamId,
            teamName: teamName || (teamData ? teamData.name : "Unknown"),
            form: lastFiveMatches,
            formString: lastFiveMatches.map(m => m.result).join(' ')
        });
    } catch (error) {
        console.error("Error fetching team form:", error);
        return json({
            error: 'Server error fetching team form',
            details: error.message
        }, { status: 500 });
    }
}