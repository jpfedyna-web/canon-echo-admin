const Anthropic = require("@anthropic-ai/sdk").default;

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { censusData, companyName, employeeCount, fundingType, industry } =
      JSON.parse(event.body);

    if (!censusData) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Census data is required" }),
      };
    }

    const analysisPrompt = `You are Canon Echo, an expert benefits analytics system. Analyze the census data and provide comprehensive workforce health intelligence.

COMPANY CONTEXT:
- Company Name: ${companyName || "Unknown Company"}
- Employee Count: ${employeeCount || "Unknown"}
- Funding Type: ${fundingType || "Unknown"}
- Industry: ${industry || "Unknown"}

CENSUS DATA:
${censusData}

Provide your analysis as JSON:

{
  "executive_summary": "2-3 compelling sentences about key findings",
  
  "census_snapshot": {
    "total_employees": <number>,
    "total_dependents": <number>,
    "total_covered_lives": <number>,
    "average_employee_age": <number>,
    "age_range": "<min> - <max>",
    "gender_split": { "male_percentage": <number>, "female_percentage": <number> },
    "dependent_ratio": <number>
  },
  
  "generational_breakdown": {
    "gen_z": { "count": <number>, "percentage": <number>, "key_insight": "insight" },
    "millennials": { "count": <number>, "percentage": <number>, "key_insight": "insight" },
    "gen_x": { "count": <number>, "percentage": <number>, "key_insight": "insight" },
    "boomers": { "count": <number>, "percentage": <number>, "key_insight": "insight" }
  },
  
  "risk_assessment": {
    "overall_score": <1-100>,
    "category": "<Low|Medium|High|Critical>",
    "trend": "<Improving|Stable|Declining>",
    "rationale": "Why this score",
    "top_risks": [
      { "risk": "Risk name", "severity": "<High|Medium|Low>", "affected": "Who/how many", "mitigation": "How to address" }
    ]
  },
  
  "key_findings": [
    { "finding": "What you found", "data_point": "The stat", "implication": "What it means", "opportunity": "How to act" }
  ],
  
  "funding_analysis": {
    "type": "${fundingType || "Unknown"}",
    "fit_assessment": "How well this structure fits the population",
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "watch_items": ["Item to monitor"]
  },
  
  "cost_drivers": [
    { "driver": "Name", "impact": "<High|Medium|Low>", "description": "Why it matters", "action": "How to address" }
  ],
  
  "action_plan": [
    {
      "action_number": 1,
      "title": "Action Title",
      "rationale": "Why based on data",
      "target_population": "Who this helps",
      "estimated_eligible": <number>,
      "tactics": [
        { "tactic": "Name", "description": "What it is", "estimated_cost": "$X,XXX", "expected_outcome": "Result" }
      ],
      "funding_source": "Where money comes from",
      "timeline": "When to do it"
    }
  ],
  
  "market_intelligence": [
    { "topic": "Topic", "insight": "What's happening", "impact": "How it affects client", "recommendation": "What to do" }
  ],
  
  "recommendations": [
    { "priority": 1, "action": "What to do", "rationale": "Why", "timeline": "When", "investment": "Cost" }
  ],
  
  "next_steps": ["Step 1", "Step 2", "Step 3"],
  
  "closing_message": "Compelling call to action"
}

Calculate ACTUAL numbers from census data. Be specific. Return ONLY valid JSON.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8096,
      messages: [{ role: "user", content: analysisPrompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let findings;
    try {
      let cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      findings = JSON.parse(cleaned);
    } catch {
      findings = { raw_analysis: responseText, parse_error: true };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, findings: findings, analyzed_at: new Date().toISOString() }),
    };
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Analysis failed", message: error.message }),
    };
  }
};
