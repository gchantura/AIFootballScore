import { json } from '@sveltejs/kit';

export async function GET() {
    const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
    const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (!API_KEY || !WEATHER_API_KEY) {
        return json({ error: 'Missing API keys' }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    const nextWeekFormatted = nextWeek.toISOString().split("T")[0];

    const API_URL = `https://api.football-data.org/v4/matches?competitions=PL,PD,BL1,SA,FL1&dateFrom=${today}&dateTo=${nextWeekFormatted}&status=SCHEDULED`;

    try {
        const response = await fetch(API_URL, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (!response.ok) {
            return json({
                error: 'Failed to fetch data',
                status: response.status,
                details: await response.text()
            }, { status: response.status });
        }

        const data = await response.json();

        // Filter out past matches (just in case)
        const now = new Date();
        const futureMatches = data.matches.filter(match => new Date(match.utcDate) > now);

        const matches = await Promise.all(futureMatches.map(async (match) => {
            // Use home team name as fallback if venue is not provided
            const venue = match.venue || match.homeTeam.name;

            // Get coordinates
            const { lat, lon } = await getVenueCoordinates(venue);

            // Fetch weather data only for matches within next 5 days
            let weatherData = { error: 'Weather forecast not available yet' };
            const matchDate = new Date(match.utcDate);
            const daysDifference = Math.ceil((matchDate - now) / (1000 * 60 * 60 * 24));

            if (lat !== 0 && lon !== 0 && daysDifference <= 5) {
                weatherData = await fetchWeather(lat, lon, match.utcDate, WEATHER_API_KEY);
            }

            return {
                id: match.id,
                competition: match.competition.name,
                homeTeam: match.homeTeam.name,
                homeTeamLogo: match.homeTeam.crest,
                awayTeam: match.awayTeam.name,
                awayTeamLogo: match.awayTeam.crest,
                date: match.utcDate,
                status: match.status,
                venue: venue,
                weather: weatherData
            };
        }));

        // Sort matches by date
        matches.sort((a, b) => new Date(a.date) - new Date(b.date));

        return json(matches);
    } catch (error) {
        return json({
            error: 'Server error',
            details: error.message
        }, { status: 500 });
    }
}

async function fetchWeather(lat, lon, matchDate, weatherApiKey) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;

    try {
        const response = await fetch(forecastUrl);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Weather API error:', errorData);
            return { error: `Failed to fetch weather data: ${errorData.message}` };
        }

        const forecastData = await response.json();

        // Find the forecast closest to match time
        const matchTimestamp = Math.floor(new Date(matchDate).getTime() / 1000);
        let closestForecast = null;
        let smallestDiff = Infinity;

        forecastData.list.forEach(item => {
            const diff = Math.abs(item.dt - matchTimestamp);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestForecast = item;
            }
        });

        if (!closestForecast) {
            return { error: "No forecast data available for match time" };
        }

        // Convert temperature to Celsius only
        const tempCelsius = (closestForecast.main.temp - 273.15).toFixed(1);

        return {
            temperature: `${tempCelsius}`,
            description: closestForecast.weather[0].description,
            humidity: `${closestForecast.main.humidity}`,
            windSpeed: `${closestForecast.wind.speed}`,
            icon: `https://openweathermap.org/img/wn/${closestForecast.weather[0].icon}.png`
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { error: `Failed to fetch weather data: ${error.message}` };
    }
}

async function getVenueCoordinates(venue) {
    // Expanded coordinates database
    const coordinates = {
        // Premier League (already in your original)
        "Liverpool FC": { lat: 53.4308, lon: -2.9606 },
        "Arsenal FC": { lat: 51.555, lon: -0.108 },
        "Nottingham Forest FC": { lat: 52.948, lon: -1.1495 },
        "Chelsea FC": { lat: 51.4816, lon: -0.1910 },
        "Manchester City FC": { lat: 53.483, lon: -2.2005 },
        "Newcastle United FC": { lat: 54.9714, lon: -1.6214 },
        "Brighton & Hove Albion FC": { lat: 50.828, lon: -0.173 },
        "Fulham FC": { lat: 51.4762, lon: -0.211 },
        "Aston Villa FC": { lat: 52.5091, lon: -1.8834 },
        "AFC Bournemouth": { lat: 50.7356, lon: -1.838 },
        "Brentford FC": { lat: 51.4857, lon: -0.3084 },
        "Crystal Palace FC": { lat: 51.3981, lon: -0.0926 },
        "Manchester United FC": { lat: 53.4631, lon: -2.2913 },
        "Tottenham Hotspur FC": { lat: 51.6044, lon: -0.0652 },
        "Everton FC": { lat: 53.4083, lon: -2.9911 },
        "West Ham United FC": { lat: 51.538, lon: 0.0086 },
        "Wolverhampton Wanderers FC": { lat: 52.586, lon: -2.125 },
        "Ipswich Town FC": { lat: 52.058, lon: 1.150 },
        "Leicester City FC": { lat: 52.6206, lon: -1.1421 },
        "Southampton FC": { lat: 50.9051, lon: -1.3917 },

        // Bundesliga
        "FC Augsburg": { lat: 48.3245, lon: 10.8998 },
        "Bayer 04 Leverkusen": { lat: 51.0386, lon: 7.0029 },
        "Bayern Munich": { lat: 48.2188, lon: 11.6247 },
        "VfL Bochum 1848": { lat: 51.4878, lon: 7.2227 },
        "Borussia Dortmund": { lat: 51.4926, lon: 7.4519 },
        "Eintracht Frankfurt": { lat: 50.0686, lon: 8.6455 },
        "SC Freiburg": { lat: 48.0225, lon: 7.8322 },
        "1. FC Heidenheim 1846": { lat: 48.6767, lon: 10.1544 },
        "TSG 1899 Hoffenheim": { lat: 49.2359, lon: 8.8859 },
        "1. FC Köln": { lat: 50.9344, lon: 6.8769 },
        "RB Leipzig": { lat: 51.3465, lon: 12.3569 },
        "1. FSV Mainz 05": { lat: 49.9725, lon: 8.2239 },
        "Borussia Mönchengladbach": { lat: 51.1756, lon: 6.3947 },
        "VfB Stuttgart": { lat: 48.7936, lon: 9.1847 },
        "1. FC Union Berlin": { lat: 52.4556, lon: 13.5264 },
        "VfL Wolfsburg": { lat: 52.4306, lon: 10.7975 },
        "SV Werder Bremen": { lat: 53.0667, lon: 8.8375 },
        "FC St. Pauli 1910": { lat: 53.5619, lon: 9.9683 },

        // Serie A
        "AC Milan": { lat: 45.4781, lon: 9.1240 },
        "Inter Milan": { lat: 45.4781, lon: 9.1240 }, // Shares San Siro with AC Milan
        "Juventus FC": { lat: 45.1096, lon: 7.6413 },
        "AS Roma": { lat: 41.9340, lon: 12.4547 },
        "SS Lazio": { lat: 41.9340, lon: 12.4547 }, // Shares Stadio Olimpico with Roma
        "Atalanta BC": { lat: 45.7098, lon: 9.6773 },
        "Bologna FC 1909": { lat: 44.4939, lon: 11.3070 },
        "Cagliari Calcio": { lat: 39.1996, lon: 9.1347 },
        "Empoli FC": { lat: 43.7167, lon: 10.4000 },
        "ACF Fiorentina": { lat: 43.7808, lon: 11.2823 },
        "Genoa CFC": { lat: 44.4154, lon: 8.9656 },
        "Hellas Verona FC": { lat: 45.4386, lon: 10.9928 },
        "US Lecce": { lat: 40.3536, lon: 18.1969 },
        "AC Monza": { lat: 45.6236, lon: 9.2744 },
        "SSC Napoli": { lat: 40.8279, lon: 14.1931 },
        "Parma Calcio 1913": { lat: 44.7969, lon: 10.3276 },
        "US Salernitana 1919": { lat: 40.6824, lon: 14.7681 },
        "US Sassuolo Calcio": { lat: 44.7249, lon: 10.8853 },
        "Torino FC": { lat: 45.0436, lon: 7.6497 },
        "Udinese Calcio": { lat: 46.0783, lon: 13.2044 },
        "Como 1907": { lat: 45.8090, lon: 9.0854 },
        "Venezia FC": { lat: 45.4843, lon: 12.3508 },

        // La Liga
        "FC Barcelona": { lat: 41.3809, lon: 2.1228 },
        "Real Madrid CF": { lat: 40.4531, lon: -3.6883 },
        "Atletico Madrid": { lat: 40.4363, lon: -3.5997 },
        "Athletic Club": { lat: 43.2642, lon: -2.9495 },
        "Real Betis Balompié": { lat: 37.3850, lon: -5.9709 },
        "RC Celta de Vigo": { lat: 42.2118, lon: -8.7391 },
        "Deportivo Alavés": { lat: 42.8499, lon: -2.6723 },
        "RCD Espanyol de Barcelona": { lat: 41.3809, lon: 2.1228 }, // Shares with Barcelona
        "Getafe CF": { lat: 40.3249, lon: -3.7249 },
        "Girona FC": { lat: 41.9609, lon: 2.8244 },
        "UD Las Palmas": { lat: 28.1248, lon: -15.4300 },
        "RCD Mallorca": { lat: 39.6206, lon: 2.6888 },
        "CA Osasuna": { lat: 42.7889, lon: -1.6369 },
        "Rayo Vallecano de Madrid": { lat: 40.3909, lon: -3.6569 },
        "Real Sociedad de Fútbol": { lat: 43.3014, lon: -1.9747 },
        "Sevilla FC": { lat: 37.3841, lon: -5.9706 },
        "Valencia CF": { lat: 39.4747, lon: -0.3583 },
        "Villarreal CF": { lat: 39.9467, lon: -0.1044 },
        "CD Leganés": { lat: 40.3269, lon: -3.7686 },
        "Real Valladolid CF": { lat: 41.6428, lon: -4.7539 },

        // Ligue 1
        "Paris Saint-Germain FC": { lat: 48.8414, lon: 2.2530 },
        "Olympique de Marseille": { lat: 43.2699, lon: 5.3959 },
        "Olympique Lyonnais": { lat: 45.7652, lon: 4.9822 },
        "AS Monaco FC": { lat: 43.7278, lon: 7.4181 },
        "OGC Nice": { lat: 43.7031, lon: 7.1927 },
        "Lille OSC": { lat: 50.6118, lon: 3.1316 },
        "Stade Rennais FC 1901": { lat: 48.1056, lon: -1.6733 },
        "RC Strasbourg Alsace": { lat: 48.5596, lon: 7.7536 },
        "FC Nantes": { lat: 47.2563, lon: -1.5251 },
        "Montpellier HSC": { lat: 43.6216, lon: 3.8134 },
        "Stade Brestois 29": { lat: 48.3904, lon: -4.4861 },
        "Stade de Reims": { lat: 49.2554, lon: 4.0286 },
        "Angers SCO": { lat: 47.4745, lon: -0.5540 },
        "Toulouse FC": { lat: 43.5836, lon: 1.4342 },
        "AJ Auxerre": { lat: 47.7986, lon: 3.5738 },
        "Clermont Foot 63": { lat: 45.7875, lon: 3.1634 },
        "Le Havre AC": { lat: 49.4939, lon: 0.1089 },
        "AS Saint-Étienne": { lat: 45.4605, lon: 4.3875 }
    };
    const venueCoordinates = coordinates[venue];
    if (!venueCoordinates) {
        console.warn(`No coordinates found for venue: ${venue}`);
        return { lat: 0, lon: 0 };
    }
    return venueCoordinates;
}