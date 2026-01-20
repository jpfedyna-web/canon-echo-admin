const Anthropic = require("@anthropic-ai/sdk").default;

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

exports.handler = async (event, context) => {
  // Extend timeout for Netlify Pro (26 seconds available)
  context.callbackWaitsForEmptyEventLoop = false;
  
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

    const isSelfFunded = (fundingType || '').toLowerCase().includes('self') || (fundingType || '').toLowerCase().includes('aso');
    
    const analysisPrompt = `You are Canon Echo, an elite benefits analytics system that transforms census data into powerful workforce health intelligence. Your reports are used by C-suite executives and require premium, insight-rich language.

COMPANY CONTEXT:
- Company Name: ${companyName || "Client Company"}
- Reported Employee Count: ${employeeCount || "Unknown"}
- Funding Type: ${fundingType || "Unknown"} ${isSelfFunded ? "(Self-funded = high flexibility for interventions)" : ""}
- Industry: ${industry || "Unknown"}

CENSUS DATA:
${censusData}

ANALYSIS INSTRUCTIONS:
1. Count actual employees from the data (don't just use reported count)
2. Calculate precise age distributions and identify each generation
3. Apply CDC/NHANES population health statistics to estimate disease prevalence
4. Use industry benchmarks to contextualize findings
5. Generate specific, actionable recommendations with vendor suggestions
6. Write with authority and emotional resonance - remember "behind every data point is a person"

Return your analysis as JSON with this EXACT structure:

{
  "executive_summary": "2-3 compelling sentences that would make a CEO stop and pay attention. Lead with the most striking finding. Use specific numbers.",
  
  "census_profile": {
    "total_employees": <actual count from data>,
    "total_dependents": <estimated: employees × 1.4>,
    "total_covered_lives": <employees + dependents>,
    "average_age": <calculated from birthdates/ages>,
    "age_range": "<youngest> - <oldest>",
    "median_age": <calculated>,
    "gender_split": {
      "male_count": <number>,
      "male_pct": <percentage>,
      "female_count": <number>,
      "female_pct": <percentage>
    },
    "key_insight": "One powerful sentence about what this demographic profile means for health risk"
  },
  
  "generational_breakdown": {
    "gen_z": {
      "count": <employees born 1997-2012>,
      "percentage": <of total>,
      "age_range": "18-27",
      "gender_split": "<X>% M / <Y>% F",
      "health_stats": [
        {"stat": "42%", "insight": "Report anxiety or depression—3× more likely to seek help IF they know where to go"},
        {"stat": "67%", "insight": "Have no established PCP—aged off parents' insurance without establishing adult care"}
      ],
      "engagement_style": "Digital-first, value authenticity, respond to peer stories and app-based solutions"
    },
    "millennials": {
      "count": <employees born 1981-1996>,
      "percentage": <of total>,
      "age_range": "28-43",
      "gender_split": "<X>% M / <Y>% F",
      "health_stats": [
        {"stat": "38%", "insight": "Already prediabetic—metabolic disease arriving 10 years earlier than prior generations"},
        {"stat": "52%", "insight": "Skip preventive care citing 'I'll do it when things calm down'—they won't"}
      ],
      "engagement_style": "Family-forming years, need flexibility, respond to convenience and time-saving solutions"
    },
    "gen_x": {
      "count": <employees born 1965-1980>,
      "percentage": <of total>,
      "age_range": "44-59",
      "gender_split": "<X>% M / <Y>% F",
      "health_stats": [
        {"stat": "47%", "insight": "Managing 2+ chronic conditions—the 'triple threat' cohort (HTN + cholesterol + prediabetes)"},
        {"stat": "28%", "insight": "Overdue for cancer screening—where early detection saves lives and costs"}
      ],
      "engagement_style": "Sandwich generation—caring for kids AND aging parents. Value efficiency and direct communication."
    },
    "boomers": {
      "count": <employees born 1946-1964>,
      "percentage": <of total>,
      "age_range": "60-78",
      "gender_split": "<X>% M / <Y>% F",
      "health_stats": [
        {"stat": "4.2", "insight": "Average active prescriptions—23% on drug combinations requiring monitoring"},
        {"stat": "$47K", "insight": "Average annual healthcare spend—but 40% is influenceable through engagement"}
      ],
      "engagement_style": "Value relationship with providers, prefer phone/in-person, respond to clinical authority"
    }
  },
  
  "risk_assessment": {
    "overall_score": <1-100, where 100 is highest risk>,
    "category": "<Low|Moderate|Elevated|High|Critical>",
    "trend_indicator": "<Improving|Stable|Concerning|Declining>",
    "score_rationale": "Explain what's driving this score in one sentence",
    "top_risks": [
      {
        "risk": "Risk name (e.g., 'Unmanaged Chronic Disease')",
        "severity": "<Critical|High|Medium>",
        "affected_population": "Who and how many",
        "financial_impact": "Estimated cost impact",
        "why_it_matters": "Human impact statement"
      }
    ],
    "protective_factors": ["List any positive factors in the population"]
  },
  
  "cancer_screening": {
    "headline": "Early detection changes everything",
    "total_screening_opportunities": <count of all eligible screenings>,
    "screenings": [
      {
        "type": "Colorectal",
        "eligible_count": <employees 45-75>,
        "early_survival": "91%",
        "late_survival": "14%",
        "eligible_criteria": "Ages 45-75",
        "current_gap": "Estimated <X>% not current on screening"
      },
      {
        "type": "Breast (Mammogram)",
        "eligible_count": <women 40-74>,
        "early_survival": "99%",
        "late_survival": "29%",
        "eligible_criteria": "Women 40-74",
        "current_gap": "Estimated <X>% overdue"
      },
      {
        "type": "Cervical",
        "eligible_count": <women 21-65>,
        "early_survival": "92%",
        "late_survival": "17%",
        "eligible_criteria": "Women 21-65",
        "current_gap": "Estimated <X>% overdue"
      },
      {
        "type": "Lung (if applicable)",
        "eligible_count": <estimated smokers 50-80>,
        "early_survival": "60%",
        "late_survival": "6%",
        "eligible_criteria": "20+ pack-year history, ages 50-80",
        "current_gap": "Most don't know they qualify"
      }
    ],
    "call_to_action": "Every screening is covered at 100%. The only barrier is awareness—and action."
  },
  
  "confidence_table": [
    {"metric": "Employee demographics", "value": "Age, gender, location", "confidence": "actual", "source": "Census file"},
    {"metric": "Generational distribution", "value": "Calculated percentages", "confidence": "actual", "source": "Birthdates in census"},
    {"metric": "Screening eligibility", "value": "Count by age/gender", "confidence": "actual", "source": "Age/gender vs. USPSTF guidelines"},
    {"metric": "Chronic disease prevalence", "value": "Estimated range", "confidence": "modeled", "source": "CDC NHANES 2022 applied to demographics"},
    {"metric": "Mental health prevalence", "value": "Estimated range", "confidence": "modeled", "source": "NIMH 2022 adjusted by age"},
    {"metric": "Individual health status", "value": "Unknown", "confidence": "requires_claims", "source": "Need claims or biometric data"}
  ],
  
  "industry_intel": [
    {
      "category": "Rx Pricing",
      "headline": "Medicare Drug Negotiation: Commercial Impact Coming",
      "insight": "CMS finalized prices for first 10 drugs (38-79% reductions). Commercial market will feel ripple effects within 2-3 years as benchmarks shift.",
      "canon_position": "Proactively discuss with your PBM how Medicare reference pricing will affect commercial contracts. This is leverage."
    },
    {
      "category": "Cost Trends",
      "headline": "GLP-1s Driving 9-11% Pharmacy Trend",
      "insight": "Medical trend 7-8%, but pharmacy is 9-11%—driven almost entirely by GLP-1 utilization for obesity and diabetes.",
      "canon_position": "GLP-1s need clinically appropriate coverage WITH guardrails. Blanket exclusion is shortsighted; unmanaged access is unsustainable. Tie to outcomes."
    },
    {
      "category": "PBM Reform",
      "headline": "FTC Report: PBMs Under Scrutiny",
      "insight": "FTC interim report finds top 3 PBMs engaged in practices that raise costs. Several states advancing reform bills.",
      "canon_position": "${isSelfFunded ? "As a self-funded group, you can renegotiate terms. Request rebate transparency immediately." : "Monitor developments and work with your carrier on transparency."}"
    },
    {
      "category": "Compliance",
      "headline": "Mental Health Parity Enforcement Tightening",
      "insight": "DOL finalized MHPAEA rules requiring comparative analysis of MH vs. medical coverage. Enforcement begins 2025.",
      "canon_position": "Request MHPAEA compliance documentation from your TPA before mid-2025. This is not optional—litigation risk is real."
    }
  ],
  
  "funding_analysis": {
    "type": "${fundingType || 'Unknown'}",
    "flexibility_rating": "${isSelfFunded ? 'High' : 'Standard'}",
    "wellness_fund": <estimate: employees × $150>,
    "innovation_fund": <estimate: employees × $75>,
    "potential_savings": <estimate: employees × $225>,
    "total_available": <sum of above>,
    "optimization_note": "${isSelfFunded ? 'Your ASO structure allows direct investment in interventions that reduce claims.' : 'Work with carrier on available wellness incentives and programs.'}"
  },
  
  "action_plan": [
    {
      "action_number": 1,
      "title": "Cancer Screening Activation",
      "rationale": "Based on demographics, you have <X> screening opportunities. Early detection = lives saved + costs avoided.",
      "funding_source": "Wellness Fund",
      "total_investment": "<calculated>",
      "tactics": [
        {
          "name": "At-Home Colorectal Kits",
          "description": "Mail FIT kits to all employees 45-75. No appointment needed. Completed at home in 5 minutes.",
          "eligible_count": <number>,
          "estimated_cost": "<$35 per kit>",
          "vendor_suggestion": "Cologuard, LetsGetChecked, Everlywell",
          "expected_outcome": "40-60% completion rate, early detection of 1-2% positive"
        },
        {
          "name": "Mobile Mammography Event",
          "description": "On-site mammography unit. 15-minute appointments during work hours. No travel, no scheduling hassle.",
          "eligible_count": <women 40-74>,
          "estimated_cost": "<$100 per screening or $4,500 event minimum>",
          "vendor_suggestion": "Alliance Mobile Health, Mammography Consultants, local hospital partnership",
          "expected_outcome": "60-80% of eligible women participate when on-site"
        },
        {
          "name": "Birthday-Month Screening Reminders",
          "description": "Personalized outreach with age/gender-specific screenings due. Concierge scheduling support included.",
          "eligible_count": "<all employees>",
          "estimated_cost": "<$15 per employee annually>",
          "vendor_suggestion": "Accolade, Rightway, Quantum Health, or internal HR campaign",
          "expected_outcome": "25-35% increase in preventive care completion"
        }
      ]
    },
    {
      "action_number": 2,
      "title": "Diabetes Prevention Program",
      "rationale": "With <X>% of your workforce in prediabetic age ranges, intervention now prevents costly chronic disease later.",
      "funding_source": "Innovation Fund",
      "total_investment": "<calculated>",
      "tactics": [
        {
          "name": "CDC-Recognized DPP",
          "description": "16-week lifestyle program with group coaching. Proven to reduce diabetes risk by 58% in landmark RCT.",
          "eligible_count": "<estimated prediabetic>",
          "estimated_cost": "$500 per participant",
          "vendor_suggestion": "Omada Health, Livongo, Vida Health, YMCA DPP",
          "expected_outcome": "5-7% weight loss, 58% reduction in diabetes progression"
        },
        {
          "name": "Healthy Plates Challenge",
          "description": "4-week company-wide nutrition challenge. Team competition, subsidized meal kit partnership, weekly prizes.",
          "eligible_count": "<all employees>",
          "estimated_cost": "$40 per participant",
          "vendor_suggestion": "Virgin Pulse, Limeade, Wellable + meal kit partner (Territory, Factor)",
          "expected_outcome": "50-60% participation, builds health culture"
        },
        {
          "name": "CGM Pilot Program",
          "description": "Continuous glucose monitors for highest-risk prediabetics. Real-time feedback on how food affects blood sugar.",
          "eligible_count": "<10-20 highest risk>",
          "estimated_cost": "$300 per person for 3-month pilot",
          "vendor_suggestion": "Levels, Nutrisense, Signos, January AI",
          "expected_outcome": "Dramatic behavior change, A1c reduction of 0.5-1.0%"
        }
      ]
    },
    {
      "action_number": 3,
      "title": "Mental Health Activation",
      "rationale": "Gen Z 42% affected, Gen X caregiver burnout, yet EAP utilization hovers at 8%. Time to close the gap.",
      "funding_source": "Wellness Fund",
      "total_investment": "<calculated>",
      "tactics": [
        {
          "name": "Leadership 'It's OK' Campaign",
          "description": "Senior leader shares personal mental health story via video or town hall. Single most effective way to destigmatize.",
          "eligible_count": "<all employees>",
          "estimated_cost": "$1,500 (video production)",
          "vendor_suggestion": "Internal comms team + One Mind at Work resources",
          "expected_outcome": "2× increase in EAP utilization within 60 days"
        },
        {
          "name": "Text-Based Therapy for Gen Z",
          "description": "Digital MH platform with texting-first approach. Matches how Gen Z actually communicates. Removes phone-call barrier.",
          "eligible_count": "<Gen Z employees>",
          "estimated_cost": "$4-8 PEPM",
          "vendor_suggestion": "Talkspace, BetterHelp, Ginger, Lyra Health",
          "expected_outcome": "3-5× higher engagement than traditional EAP among under-30s"
        },
        {
          "name": "Manager Training Workshop",
          "description": "2-hour session for all people managers. How to notice signs, how to ask, how to connect to resources. Caregiver module for Gen X.",
          "eligible_count": "<all managers>",
          "estimated_cost": "$5,000 for company-wide training",
          "vendor_suggestion": "Mental Health First Aid, meQuilibrium, Spring Health",
          "expected_outcome": "Managers become front-line mental health allies"
        }
      ]
    }
  ],
  
  "executive_concierge": {
    "headline": "Your Personalized Vendor Activation Plan",
    "intro": "Based on your specific workforce demographics, here are the vendors and partners best suited to address your top opportunities:",
    "recommendations": [
      {
        "category": "Navigation & Advocacy",
        "need": "Help employees find the right care at the right time",
        "top_picks": [
          {"vendor": "Accolade", "why": "Best for complex populations needing high-touch support", "cost_range": "$8-15 PEPM"},
          {"vendor": "Rightway", "why": "Strong PBM navigation + care guidance combo", "cost_range": "$5-10 PEPM"},
          {"vendor": "Quantum Health", "why": "Excellent for self-funded groups wanting claims impact", "cost_range": "$6-12 PEPM"}
        ]
      },
      {
        "category": "Mental Health",
        "need": "Address the 28-42% experiencing anxiety/depression",
        "top_picks": [
          {"vendor": "Lyra Health", "why": "Highest clinical quality, evidence-based matching", "cost_range": "$7-12 PEPM"},
          {"vendor": "Spring Health", "why": "Fast access, strong ROI data", "cost_range": "$6-10 PEPM"},
          {"vendor": "Headspace/Ginger", "why": "Good for prevention + lower acuity needs", "cost_range": "$3-6 PEPM"}
        ]
      },
      {
        "category": "Diabetes Prevention",
        "need": "Reach the estimated 30-40% with prediabetes",
        "top_picks": [
          {"vendor": "Omada Health", "why": "Original digital DPP, strong outcomes data", "cost_range": "$500/participant"},
          {"vendor": "Vida Health", "why": "Broader chronic condition support beyond diabetes", "cost_range": "$80-150 PEPM"},
          {"vendor": "Virta Health", "why": "For existing diabetics wanting reversal", "cost_range": "$400/month"}
        ]
      },
      {
        "category": "Cancer Screening",
        "need": "Close the gap on preventive screenings",
        "top_picks": [
          {"vendor": "Color Health", "why": "Comprehensive screening + genetic testing platform", "cost_range": "$5-10 PEPM"},
          {"vendor": "Grail (Galleri)", "why": "Multi-cancer early detection blood test", "cost_range": "$949/test"},
          {"vendor": "Cologuard/Exact Sciences", "why": "At-home colorectal screening, high completion", "cost_range": "$35-50/kit"}
        ]
      }
    ],
    "next_steps": [
      "Schedule 30-minute vendor intro calls for top 2-3 priorities",
      "Request ROI case studies specific to your industry and size",
      "Pilot with 10-15% of population before full rollout",
      "Establish baseline metrics NOW to measure impact"
    ]
  },
  
  "closing": {
    "headline": "The Patterns Are Clear. The Funds Are Available. The Path Is Ready.",
    "message": "With the insights from this analysis, you have the information needed to make strategic decisions about your workforce health investments. Every data point represents a person—a parent, a partner, someone who deserves to know what we can see before it's too late to act.",
    "tagline": "Putting the Human back in Human Capital."
  }
}

CRITICAL INSTRUCTIONS:
- Calculate REAL numbers from the census data provided
- Use compelling, executive-level language throughout
- Include specific vendor names and cost estimates
- Make every statistic feel human and actionable
- Return ONLY valid JSON - no markdown, no explanation, just the JSON object`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: analysisPrompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    let findings;
    try {
      let cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      findings = JSON.parse(cleaned);
    } catch (e) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          findings = JSON.parse(jsonMatch[0]);
        } catch {
          findings = { executive_summary: responseText, parse_error: true, raw: responseText.substring(0, 500) };
        }
      } else {
        findings = { executive_summary: responseText, parse_error: true };
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
