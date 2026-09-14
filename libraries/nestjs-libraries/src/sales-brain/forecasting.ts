import { SalesPipelineStage } from '@prisma/client';

// Rough, clearly-labeled-as-estimate probability of closing by pipeline stage.
// Not fitted to historical data yet (see self-learning insights for that) -
// these are sane defaults used until enough won/lost history exists to fit real ones.
const STAGE_CLOSE_PROBABILITY: Record<SalesPipelineStage, number> = {
  NEW: 0.05,
  QUALIFIED: 0.15,
  OPPORTUNITY: 0.35,
  PROPOSAL: 0.55,
  NEGOTIATION: 0.75,
  WON: 1,
  LOST: 0,
  NURTURE: 0.1,
};

export interface ForecastLeadInput {
  pipelineStage: SalesPipelineStage;
  leadScore: number;
  price: number | null;
}

export interface ForecastResult {
  isEstimate: true;
  pipelineValue: number;
  weightedForecast: number;
  wonRevenue: number;
  revenueAtRisk: number;
  leadsWithoutPriceCount: number;
  byStage: Record<
    string,
    { count: number; value: number; probability: number; weightedValue: number }
  >;
}

/**
 * Deterministic pipeline forecast - not an AI call, so it stays reproducible
 * and auditable. Always label output as an estimate per the no-hallucination
 * policy: these are probabilities, not facts.
 */
export function calculateForecast(leads: ForecastLeadInput[]): ForecastResult {
  const byStage: ForecastResult['byStage'] = {};
  let pipelineValue = 0;
  let weightedForecast = 0;
  let wonRevenue = 0;
  let revenueAtRisk = 0;
  let leadsWithoutPriceCount = 0;

  for (const lead of leads) {
    const price = lead.price ?? 0;
    if (lead.price == null) {
      leadsWithoutPriceCount += 1;
    }
    const probability = STAGE_CLOSE_PROBABILITY[lead.pipelineStage] ?? 0;

    if (!byStage[lead.pipelineStage]) {
      byStage[lead.pipelineStage] = { count: 0, value: 0, probability, weightedValue: 0 };
    }
    byStage[lead.pipelineStage].count += 1;
    byStage[lead.pipelineStage].value += price;
    byStage[lead.pipelineStage].weightedValue += price * probability;

    if (lead.pipelineStage === 'WON') {
      wonRevenue += price;
    } else if (lead.pipelineStage !== 'LOST') {
      pipelineValue += price;
      weightedForecast += price * probability;
      if (lead.leadScore <= 40) {
        revenueAtRisk += price;
      }
    }
  }

  return {
    isEstimate: true,
    pipelineValue: Math.round(pipelineValue),
    weightedForecast: Math.round(weightedForecast),
    wonRevenue: Math.round(wonRevenue),
    revenueAtRisk: Math.round(revenueAtRisk),
    leadsWithoutPriceCount,
    byStage,
  };
}
