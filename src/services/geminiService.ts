import { GoogleGenAI } from "@google/genai";
import { Player, TeamRating } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeTeam(players: Player[]): Promise<TeamRating> {
  if (players.length === 0) {
    return {
      overall: 0,
      batting: 0,
      bowling: 0,
      allRounder: 0,
      balance: 0,
      suggestions: ["Add players to start the analysis."]
    };
  }

  const prompt = `
    Analyze this cricket playing XI squad and provide a rating out of 10 for each category based on these rules:
    
    1. Batting Strength: Evaluate number of top-order batters. Reward players with high ratings (representing average/strike rate).
    2. Bowling Strength: Count fast bowlers and spinners. Reward teams with at least 4-5 solid bowling options.
    3. All-Rounder Impact: Detect players who contribute with both bat and ball. Increase score if 2 or more all-rounders exist.
    4. Team Balance: Check for at least 1 wicketkeeper, 4-5 bowlers, and a mix of top/middle order.
    
    Deductions:
    - No wicketkeeper: -2 balance
    - No spinner: -1.5 balance
    - No death bowler: -1.5 balance
    - Too many batters (more than 7): -1 balance
    - Not enough bowlers (less than 4): -2 balance

    Players Data: ${players.map(p => `
      Name: ${p.name}, 
      Role: ${p.role}, 
      Skill Rating: ${p.rating}, 
      Batting Position: ${p.battingPosition || 'N/A'}, 
      Bowling Type: ${p.bowlingType || 'None'}, 
      Death Bowler: ${p.isDeathBowler ? 'Yes' : 'No'}
    `).join("; ")}

    Return the response in JSON format matching this schema:
    {
      "overall": number,
      "batting": number,
      "bowling": number,
      "allRounder": number,
      "balance": number,
      "suggestions": string[]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      overall: result.overall || 0,
      batting: result.batting || 0,
      bowling: result.bowling || 0,
      allRounder: result.allRounder || 0,
      balance: result.balance || 0,
      suggestions: result.suggestions || ["Could not generate suggestions."]
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return calculateHeuristicRating(players);
  }
}

function calculateHeuristicRating(players: Player[]): TeamRating {
  const batters = players.filter(p => p.role === 'Batter');
  const bowlers = players.filter(p => p.role === 'Bowler');
  const allRounders = players.filter(p => p.role === 'All-Rounder');
  const keepers = players.filter(p => p.role === 'Wicketkeeper');

  const topOrder = players.filter(p => p.battingPosition === 'Top Order').length;
  const spinners = players.filter(p => p.bowlingType === 'Spin').length;
  const fastBowlers = players.filter(p => p.bowlingType === 'Fast').length;
  const deathBowlers = players.filter(p => p.isDeathBowler).length;

  // Batting Rating
  let battingScore = (players.reduce((acc, p) => acc + p.rating, 0) / players.length) || 0;
  if (topOrder >= 3) battingScore += 1;
  if (topOrder > 5) battingScore -= 1; // Too many top order
  battingScore = Math.min(10, Math.max(0, battingScore));

  // Bowling Rating
  let bowlingScore = (bowlers.length * 2) + (allRounders.length * 1);
  if (spinners > 0 && fastBowlers > 0) bowlingScore += 1;
  if (deathBowlers > 0) bowlingScore += 1;
  bowlingScore = Math.min(10, Math.max(0, bowlingScore));

  // All-Rounder Rating
  let arScore = allRounders.length * 3;
  if (allRounders.length >= 2) arScore += 2;
  arScore = Math.min(10, Math.max(0, arScore));

  // Balance Rating
  let balance = 7;
  const suggestions = [];

  if (keepers.length === 0) {
    balance -= 2;
    suggestions.push("Your squad needs a wicketkeeper.");
  }
  if (spinners === 0) {
    balance -= 1.5;
    suggestions.push("Your squad needs another spinner.");
  }
  if (deathBowlers === 0) {
    balance -= 1.5;
    suggestions.push("No specialist death bowler detected.");
  }
  if (players.length > 7 && (batters.length + keepers.length) > 7) {
    balance -= 1;
    suggestions.push("Too many batters; bowling attack might be weak.");
  }
  if (bowlers.length + allRounders.length < 4) {
    balance -= 2;
    suggestions.push("Not enough bowling options (need at least 4).");
  }

  if (suggestions.length === 0 && players.length === 11) {
    suggestions.push("Balanced squad with strong options.");
  }

  const overall = (battingScore * 0.4 + bowlingScore * 0.4 + balance * 0.2);

  return {
    overall: Number(overall.toFixed(1)),
    batting: Number(battingScore.toFixed(1)),
    bowling: Number(bowlingScore.toFixed(1)),
    allRounder: Number(arScore.toFixed(1)),
    balance: Number(Math.max(0, Math.min(10, balance)).toFixed(1)),
    suggestions: suggestions.length > 0 ? suggestions : ["Your team looks well-balanced!"]
  };
}
