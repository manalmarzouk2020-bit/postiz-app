import { z } from 'zod';

// Structured contract the LLM must fill in for every inbound message.
// Mirrors the 20-step decision loop: intent -> stage -> emotional state ->
// pain -> missing info -> objections -> fit -> probability -> strategy -> response.
export const SalesBrainDecisionSchema = z.object({
  intent: z.string().describe('Short summary of what the prospect wants right now'),
  buyingStage: z.enum([
    'UNAWARE',
    'PROBLEM_AWARE',
    'SOLUTION_AWARE',
    'PRODUCT_AWARE',
    'COMPARING',
    'CONSIDERING',
    'READY_TO_BUY',
    'NEGOTIATING',
    'POSTPONING',
    'LOST',
    'CUSTOMER',
    'REPEAT_BUYER',
  ]),
  emotionalState: z.string().describe('e.g. curious, skeptical, frustrated, excited, urgent'),
  painPoints: z
    .array(
      z.object({
        problem: z.string(),
        severity: z.number().min(0).max(100),
      })
    )
    .describe('Genuine pain expressed or clearly implied by the prospect, never invented'),
  painScore: z.number().min(0).max(100).describe('Overall pain severity 0-100'),
  missingInformation: z
    .array(z.string())
    .describe('Facts the brain still needs before it can recommend or close'),
  objections: z
    .array(
      z.object({
        rawText: z.string(),
        category: z.string().describe('e.g. price, trust, timing, authority, need_more_info'),
        isSurfaceObjection: z.boolean().describe('true if this likely masks a different real concern'),
      })
    )
    .describe('Only objections actually present in the conversation'),
  productFit: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        fitScore: z.number().min(0).max(100),
        reason: z.string(),
      })
    )
    .describe('Fit score per candidate product supplied in context, best fit first'),
  buyingProbability: z.number().min(0).max(1),
  confidence: z.object({
    productFit: z.number().min(0).max(1),
    buyingIntent: z.number().min(0).max(1),
    painSeverity: z.number().min(0).max(1),
    budgetConfidence: z.number().min(0).max(1),
    decisionMakerConfidence: z.number().min(0).max(1),
  }),
  urgency: z.enum(['low', 'medium', 'high']),
  budgetSignal: z.enum(['none', 'unclear', 'confirmed']),
  authorityLevel: z.enum(['unknown', 'influencer', 'decision_maker']),
  conversationalObjective: z
    .enum([
      'ask_question',
      'clarify',
      'diagnose',
      'educate',
      'demonstrate_value',
      'provide_proof',
      'handle_objection',
      'reframe',
      'recommend',
      'offer_package',
      'give_pricing',
      'ask_for_commitment',
      'follow_up',
      'escalate_to_human',
    ])
    .describe('The single most useful next conversational move'),
  recommendedAction: z.string().describe('Human-readable next best action for the sales owner'),
  shouldEscalateToHuman: z.boolean(),
  escalationReason: z.string().nullable(),
  response: z
    .string()
    .describe(
      'The actual reply to send the prospect. Must only use facts present in the supplied product/business context — never invent prices, features, guarantees or testimonials. If information is unavailable, say so.'
    ),
});

export type SalesBrainDecision = z.infer<typeof SalesBrainDecisionSchema>;

export interface SalesBrainProductContext {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  pricingModel?: string | null;
  features?: unknown;
  benefits?: unknown;
  primaryOutcome?: string | null;
  guarantees?: string | null;
  refundPolicy?: string | null;
  competitors?: unknown;
  testimonials?: unknown;
  faqs?: unknown;
}

export interface SalesBrainConversationMessage {
  role: 'LEAD' | 'AI' | 'HUMAN';
  content: string;
}

// The 15-section Sales Playbook auto-generated from an org's product catalog
// (master spec section 26). Kept to plain strings/arrays so it renders directly.
export const SalesPlaybookSchema = z.object({
  idealCustomers: z.array(z.string()),
  buyerPersonas: z.array(
    z.object({ name: z.string(), description: z.string() })
  ),
  painPoints: z.array(z.string()),
  buyingTriggers: z.array(z.string()),
  discoveryQuestions: z.array(z.string()),
  valuePropositions: z.array(z.string()),
  productPositioning: z.string(),
  objectionLibrary: z.array(
    z.object({ objection: z.string(), response: z.string() })
  ),
  competitorDifferentiation: z.array(z.string()),
  closingStrategies: z.array(z.string()),
  followUpSequences: z.array(z.string()),
  qualificationRules: z.array(z.string()),
  escalationRules: z.array(z.string()),
  upsellStrategy: z.array(z.string()),
});

export type SalesPlaybook = z.infer<typeof SalesPlaybookSchema>;

// Post-hoc conversation quality scoring (master spec section 22).
export const SalesConversationAnalysisSchema = z.object({
  discovery: z.number().min(0).max(100),
  personalization: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
  empathy: z.number().min(0).max(100),
  valueCommunication: z.number().min(0).max(100),
  objectionHandling: z.number().min(0).max(100),
  closing: z.number().min(0).max(100),
  followUp: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  whyBought: z
    .string()
    .nullable()
    .describe('Only if the transcript shows evidence of a purchase decision, else null'),
  whyNotBought: z
    .string()
    .nullable()
    .describe('Only if the transcript shows evidence the prospect declined or stalled, else null'),
});

export type SalesConversationAnalysisResult = z.infer<
  typeof SalesConversationAnalysisSchema
>;

// Personal sales coach report (master spec section 23).
export const SalesCoachingReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missedOpportunities: z.array(z.string()),
  badQuestions: z.array(z.string()),
  weakResponses: z.array(z.string()),
  missedClosingMoments: z.array(z.string()),
  objectionHandlingMistakes: z.array(z.string()),
  recommendedImprovements: z.array(z.string()),
});

export type SalesCoachingReportResult = z.infer<typeof SalesCoachingReportSchema>;

// Roleplay simulator scoring (master spec section 24).
export const RoleplayFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  didWell: z.array(z.string()),
  didPoorly: z.array(z.string()),
  shouldHaveAsked: z.array(z.string()),
  shouldHaveSaid: z.array(z.string()),
  whereControlWasLost: z.string().nullable(),
  betterResponseExamples: z.array(z.string()),
});

export type RoleplayFeedbackResult = z.infer<typeof RoleplayFeedbackSchema>;

// Self-learning pattern insights from aggregated pipeline/objection data
// (master spec section 38). Grounded only in the aggregate summary given.
export const SalesInsightsSchema = z.object({
  insights: z.array(
    z.object({
      pattern: z.string().describe('The pattern observed, e.g. "Leads mentioning price objection convert less"'),
      evidence: z.string().describe('The specific numbers from the summary that support this'),
      confidence: z.enum(['low', 'medium', 'high']),
      recommendedAction: z.string(),
    })
  ),
});

export type SalesInsightsResult = z.infer<typeof SalesInsightsSchema>;

export interface SalesBrainDecisionRequest {
  organizationName: string;
  assistantName?: string;
  lead: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    knownPainPoints?: unknown;
    knownGoals?: unknown;
    buyingStage: string;
    previousObjections?: unknown;
  };
  products: SalesBrainProductContext[];
  history: SalesBrainConversationMessage[];
  incomingMessage: string;
}
