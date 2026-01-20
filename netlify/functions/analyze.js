const Anthropic = require("@anthropic-ai/sdk").default;

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { censusData, companyName, employeeCount, fundingType, industry } = JSON.parse(event.body);
    if (!censusData) {
      return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Census data required" }) };
    }

    const isSelfFunded = (fundingType || '').toLowerCase().includes('self') || (fundingType || '').toLowerCase().includes('aso');
    const truncatedCensus = censusData.substring(0, 5000);
    
    const prompt = `You are Canon Echo, an elite benefits analytics AI. Analyze this census and return JSON only.

COMPANY: ${companyName || "Client"} | EMPLOYEES: ${employeeCount || "See data"} | FUNDING: ${fundingType || "Unknown"} | INDUSTRY: ${industry || "Unknown"}

CENSUS:
${truncatedCensus}

Return ONLY valid JSON (no markdown, no explanation):
{
  "executive_summary": "2-3 powerful sentences with specific numbers that a CEO would stop to read",
  "census_profile": {
    "total_employees": <from data>,
    "total_dependents": <employees × 1.4>,
    "total_covered_lives": <sum>,
    "average_age": <calculated>,
    "key_insight": "What this demographic means for health risk"
  },
  "generational_breakdown": {
    "gen_z": {"percentage": <num>, "count": <num>, "health_stats": [{"stat": "42%", "insight": "Report anxiety/depression—3× more likely to seek help IF they know where"}, {"stat": "67%", "insight": "No established PCP—aged off parents' insurance"}]},
    "millennials": {"percentage": <num>, "count": <num>, "health_stats": [{"stat": "38%", "insight": "Already prediabetic—metabolic disease arriving 10 years early"}, {"stat": "52%", "insight": "Skip preventive care—'I'll do it when things calm down'"}]},
    "gen_x": {"percentage": <num>, "count": <num>, "health_stats": [{"stat": "47%", "insight": "Managing 2+ chronic conditions—the 'triple threat' cohort"}, {"stat": "28%", "insight": "Overdue for cancer screening"}]},
    "boomers": {"percentage": <num>, "count": <num>, "health_stats": [{"stat": "4.2", "insight": "Average prescriptions—23% need monitoring"}, {"stat": "$47K", "insight": "Annual spend—40% influenceable"}]}
  },
  "risk_assessment": {
    "overall_score": <1-100>,
    "category": "<Low|Moderate|Elevated|High>",
    "top_risks": [{"risk": "Risk name", "severity": "High", "affected": "Who", "why_matters": "Impact"}]
  },
  "cancer_screening": {
    "screenings": [
      {"type": "Colorectal", "eligible_count": <45-75>, "early_survival": "91%", "late_survival": "14%"},
      {"type": "Breast", "eligible_count": <women 40-74>, "early_survival": "99%", "late_survival": "29%"},
      {"type": "Cervical", "eligible_count": <women 21-65>, "early_survival": "92%", "late_survival": "17%"},
      {"type": "Lung", "eligible_count": <smokers est>, "early_survival": "60%", "late_survival": "6%"}
    ]
  },
  "action_plan": [
    {"action_number": 1, "title": "Cancer Screening Activation", "funding_source": "Wellness Fund", "rationale": "X screening opportunities", "tactics": [
      {"name": "At-Home Colorectal Kits", "description": "Mail FIT kits to 45-75", "eligible_count": <num>, "cost": "$35/kit", "vendor": "Cologuard, LetsGetChecked"},
      {"name": "Mobile Mammography", "description": "On-site screening", "eligible_count": <num>, "cost": "$100/screen", "vendor": "Alliance Mobile Health"},
      {"name": "Birthday Reminders", "description": "Personalized outreach", "eligible_count": <all>, "cost": "$15/person", "vendor": "Accolade, Quantum Health"}
    ]},
    {"action_number": 2, "title": "Diabetes Prevention", "funding_source": "Innovation Fund", "rationale": "Est X prediabetic", "tactics": [
      {"name": "CDC DPP Program", "description": "16-week, 58% risk reduction", "eligible_count": <num>, "cost": "$500/person", "vendor": "Omada Health, Vida Health"},
      {"name": "Nutrition Challenge", "description": "4-week competition", "eligible_count": <all>, "cost": "$40/person", "vendor": "Virgin Pulse"},
      {"name": "CGM Pilot", "description": "Glucose monitors", "eligible_count": <20>, "cost": "$300/person", "vendor": "Levels, Nutrisense"}
    ]},
    {"action_number": 3, "title": "Mental Health Activation", "funding_source": "Wellness Fund", "rationale": "Gen Z 42% affected, EAP 8%", "tactics": [
      {"name": "Leadership Campaign", "description": "Leader shares MH story", "eligible_count": <all>, "cost": "$1,500", "vendor": "One Mind at Work"},
      {"name": "Text-Based Therapy", "description": "Digital MH for Gen Z", "eligible_count": <gen_z>, "cost": "$6 PEPM", "vendor": "Talkspace, Lyra Health"},
      {"name": "Manager Training", "description": "MH awareness", "eligible_count": <mgrs>, "cost": "$5,000", "vendor": "Mental Health First Aid"}
    ]}
  ],
  "executive_concierge": {
    "recommendations": [
      {"category": "Navigation", "vendor": "Accolade", "why": "High-touch support", "cost": "$8-15 PEPM"},
      {"category": "Navigation", "vendor": "Quantum Health", "why": "Claims impact", "cost": "$6-12 PEPM"},
      {"category": "Mental Health", "vendor": "Lyra Health", "why": "Best clinical quality", "cost": "$7-12 PEPM"},
      {"category": "Mental Health", "vendor": "Spring Health", "why": "Fast access", "cost": "$6-10 PEPM"},
      {"category": "Diabetes", "vendor": "Omada Health", "why": "Proven DPP", "cost": "$500/person"},
      {"category": "Screening", "vendor": "Color Health", "why": "Comprehensive", "cost": "$5-10 PEPM"},
      {"category": "Screening", "vendor": "Cologuard", "why": "At-home, high completion", "cost": "$35/kit"}
    ],
    "next_steps": ["Schedule vendor calls", "Request ROI case studies", "Pilot 10-15%", "Set baseline metrics"]
  },
  "funding_analysis": {
    "wellness_fund": <employees × 150>,
    "innovation_fund": <employees × 75>,
    "potential_savings": <employees × 225>,
    "total_available": <sum>
  }
}

Calculate REAL numbers from census. Return ONLY the JSON object.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3500,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    let findings;
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      findings = JSON.parse(cleaned);
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { findings = JSON.parse(jsonMatch[0]); } 
        catch { findings = { executive_summary: responseText.substring(0, 500), parse_error: true }; }
      } else {
        findings = { executive_summary: responseText.substring(0, 500), parse_error: true };
      }
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, findings, analyzed_at: new Date().toISOString() }),
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
