const Anthropic = require("@anthropic-ai/sdk").default;

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { censusData, companyName, employeeCount, fundingType, industry } = JSON.parse(event.body);

    if (!censusData) {
      return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Census data is required" }) };
    }

    // Truncate census data if too large to speed up processing
    const truncatedData = censusData.length > 8000 ? censusData.substring(0, 8000) + "\n...[truncated]" : censusData;

    const prompt = `Analyze this employee census data for ${companyName || "Company"}. Funding: ${fundingType || "Unknown"}. Industry: ${industry || "Unknown"}.

DATA:
${truncatedData}

Return JSON only:
{
  "executive_summary": "2 sentence summary of key findings",
  "census_snapshot": {
    "total_employees": <number>,
    "total_dependents": <number>,
    "average_age": <number>,
    "male_pct": <number>,
    "female_pct": <number>
  },
  "risk_assessment": {
    "score": <1-100>,
    "category": "<Low|Medium|High>",
    "top_risk": "Main risk identified"
  },
  "generational_breakdown": {
    "gen_z_pct": <number>,
    "millennial_pct": <number>,
    "gen_x_pct": <number>,
    "boomer_pct": <number>
  },
  "top_findings": [
    {"finding": "Finding 1", "action": "What to do"},
    {"finding": "Finding 2", "action": "What to do"},
    {"finding": "Finding 3", "action": "What to do"}
  ],
  "cost_drivers": [
    {"driver": "Driver 1", "impact": "High|Medium|Low"},
    {"driver": "Driver 2", "impact": "High|Medium|Low"}
  ],
  "recommendations": [
    {"action": "Action 1", "timeline": "When", "savings": "Potential savings"},
    {"action": "Action 2", "timeline": "When", "savings": "Potential savings"},
    {"action": "Action 3", "timeline": "When", "savings": "Potential savings"}
  ],
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    let findings;
    try {
      let cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      findings = JSON.parse(cleaned);
    } catch {
      findings = { executive_summary: responseText, parse_error: true };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, findings, analyzed_at: new Date().toISOString() }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Analysis failed", message: error.message }),
    };
  }
};
