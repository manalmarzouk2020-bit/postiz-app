import { SalesBuyingStage } from '@prisma/client';

export type LeadScoreBand = 'cold' | 'low_intent' | 'potential' | 'qualified' | 'hot';

export interface LeadScoreInputs {
  buyingStage: SalesBuyingStage;
  painScore: number;
  urgency?: 'low' | 'medium' | 'high' | null;
  budgetSignal?: 'none' | 'unclear' | 'confirmed' | null;
  authorityLevel?: 'unknown' | 'influencer' | 'decision_maker' | null;
  productFitConfidence: number;
  engagementCount: number;
  objectionCount: number;
}

const STAGE_WEIGHTS: Record<SalesBuyingStage, number> = {
  UNAWARE: 5,
  PROBLEM_AWARE: 20,
  SOLUTION_AWARE: 35,
  PRODUCT_AWARE: 50,
  COMPARING: 60,
  CONSIDERING: 70,
  READY_TO_BUY: 90,
  NEGOTIATING: 85,
  POSTPONING: 40,
  LOST: 0,
  CUSTOMER: 100,
  REPEAT_BUYER: 100,
};

const URGENCY_WEIGHTS = { low: 5, medium: 15, high: 25 } as const;
const BUDGET_WEIGHTS = { none: 0, unclear: 8, confirmed: 20 } as const;
const AUTHORITY_WEIGHTS = { unknown: 5, influencer: 10, decision_maker: 20 } as const;

/**
 * Deterministic 0-100 lead score combining buying stage, pain severity, urgency,
 * budget/authority signals, AI-estimated product fit, engagement and outstanding
 * objections. Kept separate from the LLM call so scores stay reproducible/testable
 * per the "no-hallucination" scoring requirement.
 */
export function calculateLeadScore(inputs: LeadScoreInputs): number {
  const stageComponent = STAGE_WEIGHTS[inputs.buyingStage] ?? 0;
  const painComponent = Math.round(Math.max(0, Math.min(100, inputs.painScore)) * 0.2);
  const urgencyComponent = URGENCY_WEIGHTS[inputs.urgency || 'low'];
  const budgetComponent = BUDGET_WEIGHTS[inputs.budgetSignal || 'unclear'];
  const authorityComponent = AUTHORITY_WEIGHTS[inputs.authorityLevel || 'unknown'];
  const fitComponent = Math.round(Math.max(0, Math.min(1, inputs.productFitConfidence)) * 20);
  const engagementComponent = Math.min(10, inputs.engagementCount * 2);
  const objectionPenalty = Math.min(15, inputs.objectionCount * 4);

  const raw =
    stageComponent * 0.35 +
    painComponent +
    urgencyComponent * 0.5 +
    budgetComponent * 0.5 +
    authorityComponent * 0.5 +
    fitComponent +
    engagementComponent -
    objectionPenalty;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function leadScoreBand(score: number): LeadScoreBand {
  if (score <= 20) return 'cold';
  if (score <= 40) return 'low_intent';
  if (score <= 60) return 'potential';
  if (score <= 80) return 'qualified';
  return 'hot';
}

const STAGE_TO_PIPELINE = {
  UNAWARE: 'NEW',
  PROBLEM_AWARE: 'NEW',
  SOLUTION_AWARE: 'QUALIFIED',
  PRODUCT_AWARE: 'QUALIFIED',
  COMPARING: 'OPPORTUNITY',
  CONSIDERING: 'OPPORTUNITY',
  READY_TO_BUY: 'PROPOSAL',
  NEGOTIATING: 'NEGOTIATION',
  POSTPONING: 'NURTURE',
  LOST: 'LOST',
  CUSTOMER: 'WON',
  REPEAT_BUYER: 'WON',
} as const;

export function pipelineStageForBuyingStage(stage: SalesBuyingStage) {
  return STAGE_TO_PIPELINE[stage];
}
