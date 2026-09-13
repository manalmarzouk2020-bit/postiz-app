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

export interface SalesBrainDecisionRequest {
  organizationName: string;
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
