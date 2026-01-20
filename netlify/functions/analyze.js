const Anthropic = require("@anthropic-ai/sdk").default;

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

exports.handler = async (event, context) => {
  // Handle CORS preflight
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

    const analysisPrompt = `You are Canon Echo, an expert benefits analytics system. Analyze the following employee census data and provide actionable insights.

COMPANY CONTEXT:
- Company Name: ${companyName || "Unknown"}
- Employee Count: ${employeeCount || "Unknown"}
- Funding Type: ${fundingType || "Unknown"}
- Industry: ${industry || "Unknown"}

CENSUS DATA:
${censusData}

Provide a comprehensive analysis in the following JSON format:
{
  "executive_summary": "A 2-3 sentence overview of key findings",
  "risk_score": {
    "overall": <number 1-100>,
    "category": "<Low|Medium|High|Critical>",
    "trend": "<Improving|Stable|Declining>"
  },
  "demographic_insights": {
    "age_distribution": "Summary of age-related findings",
    "gender_breakdown": "Summary of gender distribution",
    "dependent_analysis": "Summary of dependent coverage patterns"
  },
  "cost_drivers": [
    {
      "factor": "Name of cost driver",
      "impact": "<High|Medium|Low>",
      "description": "Brief explanation",
      "recommendation": "Actionable suggestion"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity name",
      "potential_savings": "Estimated savings or impact",
      "implementation": "How to capture this opportunity",
      "priority": "<High|Medium|Low>"
    }
  ],
  "recommendations": [
    {
      "action": "Specific recommended action",
      "rationale": "Why this matters",
      "timeline": "When to implement",
      "expected_outcome": "What to expect"
    }
  ],
  "benchmarks": {
    "vs_industry": "How this compares to industry norms",
    "vs_size_peers": "How this compares to similar-sized companies"
  },
  "next_steps": [
    "Immediate action item 1",
    "Immediate action item 2",
    "Immediate action item 3"
  ]
}

Return ONLY valid JSON. No markdown, no explanation, just the JSON object.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Try to parse as JSON
    let findings;
    try {
      findings = JSON.parse(responseText);
    } catch {
      // If not valid JSON, wrap the response
      findings = {
        raw_analysis: responseText,
        parse_error: true,
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        findings: findings,
        analyzed_at: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Analysis failed",
        message: error.message,
      }),
    };
  }
};
