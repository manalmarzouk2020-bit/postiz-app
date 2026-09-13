import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { shuffle } from 'lodash';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import {
  SalesBrainDecision,
  SalesBrainDecisionRequest,
  SalesBrainDecisionSchema,
  SalesBrainProductContext,
  SalesPlaybook,
  SalesPlaybookSchema,
} from '@gitroom/nestjs-libraries/sales-brain/sales-brain.types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-',
});

const PicturePrompt = z.object({
  prompt: z.string(),
});

const VoicePrompt = z.object({
  voice: z.string(),
});

@Injectable()
export class OpenaiService {
  async generateImage(prompt: string, isUrl: boolean, isVertical = false) {
    const generate = (
      await openai.images.generate({
        prompt,
        response_format: isUrl ? 'url' : 'b64_json',
        model: 'dall-e-3',
        ...(isVertical ? { size: '1024x1792' } : {}),
      })
    ).data[0];

    return isUrl ? generate.url : generate.b64_json;
  }

  async generatePromptForPicture(prompt: string) {
    return (
      (
        await openai.chat.completions.parse({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are an assistant that take a description and style and generate a prompt that will be used later to generate images, make it a very long and descriptive explanation, and write a lot of things for the renderer like, if it${"'"}s realistic describe the camera`,
            },
            {
              role: 'user',
              content: `prompt: ${prompt}`,
            },
          ],
          response_format: zodResponseFormat(PicturePrompt, 'picturePrompt'),
        })
      ).choices[0].message.parsed?.prompt || ''
    );
  }

  async generateVoiceFromText(prompt: string) {
    return (
      (
        await openai.chat.completions.parse({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are an assistant that takes a social media post and convert it to a normal human voice, to be later added to a character, when a person talk they don\'t use "-", and sometimes they add pause with "..." to make it sounds more natural, make sure you use a lot of pauses and make it sound like a real person`,
            },
            {
              role: 'user',
              content: `prompt: ${prompt}`,
            },
          ],
          response_format: zodResponseFormat(VoicePrompt, 'voice'),
        })
      ).choices[0].message.parsed?.voice || ''
    );
  }

  async generatePosts(content: string) {
    const posts = (
      await Promise.all([
        openai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content:
                'Generate a Twitter post from the content without emojis in the following JSON format: { "post": string } put it in an array with one element',
            },
            {
              role: 'user',
              content: content!,
            },
          ],
          n: 5,
          temperature: 1,
          model: 'gpt-4.1',
        }),
        openai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content:
                'Generate a thread for social media in the following JSON format: Array<{ "post": string }> without emojis',
            },
            {
              role: 'user',
              content: content!,
            },
          ],
          n: 5,
          temperature: 1,
          model: 'gpt-4.1',
        }),
      ])
    ).flatMap((p) => p.choices);

    return shuffle(
      posts.map((choice) => {
        const { content } = choice.message;
        const start = content?.indexOf('[')!;
        const end = content?.lastIndexOf(']')!;
        try {
          return JSON.parse(
            '[' +
              content
                ?.slice(start + 1, end)
                .replace(/\n/g, ' ')
                .replace(/ {2,}/g, ' ') +
              ']'
          );
        } catch (e) {
          return [];
        }
      })
    );
  }
  async extractWebsiteText(content: string) {
    const websiteContent = await openai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You take a full website text, and extract only the article content',
        },
        {
          role: 'user',
          content,
        },
      ],
      model: 'gpt-4.1',
    });

    const { content: articleContent } = websiteContent.choices[0].message;

    return this.generatePosts(articleContent!);
  }

  async separatePosts(content: string, len: number) {
    const SeparatePostsPrompt = z.object({
      posts: z.array(z.string()),
    });

    const SeparatePostPrompt = z.object({
      post: z.string().max(len),
    });

    const posts =
      (
        await openai.chat.completions.parse({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are an assistant that take a social media post and break it to a thread, each post must be minimum ${
                len - 10
              } and maximum ${len} characters, keeping the exact wording and break lines, however make sure you split posts based on context`,
            },
            {
              role: 'user',
              content: content,
            },
          ],
          response_format: zodResponseFormat(
            SeparatePostsPrompt,
            'separatePosts'
          ),
        })
      ).choices[0].message.parsed?.posts || [];

    return {
      posts: await Promise.all(
        posts.map(async (post: any) => {
          if (post.length <= len) {
            return post;
          }

          let retries = 4;
          while (retries) {
            try {
              return (
                (
                  await openai.chat.completions.parse({
                    model: 'gpt-4.1',
                    messages: [
                      {
                        role: 'system',
                        content: `You are an assistant that take a social media post and shrink it to be maximum ${len} characters, keeping the exact wording and break lines`,
                      },
                      {
                        role: 'user',
                        content: post,
                      },
                    ],
                    response_format: zodResponseFormat(
                      SeparatePostPrompt,
                      'separatePost'
                    ),
                  })
                ).choices[0].message.parsed?.post || ''
              );
            } catch (e) {
              retries--;
            }
          }

          return post;
        })
      ),
    };
  }

  async generateSlidesFromText(text: string) {
    for (let i = 0; i < 3; i++) {
      try {
        const message = `You are an assistant that takes a text and break it into slides, each slide should have an image prompt and voice text to be later used to generate a video and voice, image prompt should capture the essence of the slide and also have a back dark gradient on top, image prompt should not contain text in the picture, generate between 3-5 slides maximum`;
        const parse =
          (
            await openai.chat.completions.parse({
              model: 'gpt-4.1',
              messages: [
                {
                  role: 'system',
                  content: message,
                },
                {
                  role: 'user',
                  content: text,
                },
              ],
              response_format: zodResponseFormat(
                z.object({
                  slides: z
                    .array(
                      z.object({
                        imagePrompt: z.string(),
                        voiceText: z.string(),
                      })
                    )
                    .describe('an array of slides'),
                }),
                'slides'
              ),
            })
          ).choices[0].message.parsed?.slides || [];

        return parse;
      } catch (err) {
        console.log(err);
      }
    }

    return [];
  }

  async generateSalesBrainDecision(
    request: SalesBrainDecisionRequest
  ): Promise<SalesBrainDecision> {
    const systemPrompt = `You are THE 20-YEAR SALES MASTER: an internal AI persona representing the accumulated judgement of an elite salesperson with 20+ years and thousands of sales conversations across B2B and B2C, low-ticket and high-ticket.

Your job for every incoming message is to run a decision loop, not to blindly pitch:
understand the message -> identify intent, buying stage and emotional state -> surface genuine (never invented) pain -> detect real vs surface objections -> score product fit against ONLY the products supplied -> estimate buying probability -> pick the single best conversational objective -> write the reply.

Hard rules (never break these):
- Never invent product features, prices, discounts, guarantees, testimonials, statistics or case studies. Use only what is given in the product context below.
- If information needed to answer is missing, say so plainly in the response rather than guessing.
- Never fabricate urgency or scarcity, never pressure, never misrepresent competitors.
- Distinguish surface objections ("I don't have budget") from what may really be behind them (no perceived value, no trust, wrong timing) but do not assert a hidden cause you cannot support from the conversation.
- If none of the supplied products genuinely fit the prospect's situation, say so honestly instead of forcing a pitch.
- Ask for the next step only when the conversation has earned it; do not close prematurely.
- Escalate to a human (shouldEscalateToHuman=true) for: high-value negotiation, an angry or distressed customer, legal/refund disputes, or anything outside the supplied product knowledge.

Business: ${request.organizationName}

Known lead context:
${JSON.stringify(request.lead, null, 2)}

Available products/offers (the ONLY products you may reference or recommend):
${JSON.stringify(request.products, null, 2)}`;

    const historyMessages = request.history.map((m) => ({
      role: (m.role === 'LEAD' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: request.incomingMessage },
      ],
      response_format: zodResponseFormat(
        SalesBrainDecisionSchema,
        'sales_brain_decision'
      ),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      throw new Error('Sales Brain decision engine returned no structured output');
    }

    return parsed;
  }

  async generateSalesPlaybook(
    organizationName: string,
    products: SalesBrainProductContext[]
  ): Promise<SalesPlaybook> {
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are THE 20-YEAR SALES MASTER building a complete Sales Playbook for "${organizationName}". Use ONLY the product/offer data supplied - never invent features, prices, guarantees or testimonials that are not present. If a section cannot be filled from the given data, make it a short, honest, general best-practice guideline instead of fabricating specifics.`,
        },
        {
          role: 'user',
          content: `Products/offers:\n${JSON.stringify(products, null, 2)}`,
        },
      ],
      response_format: zodResponseFormat(SalesPlaybookSchema, 'sales_playbook'),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      throw new Error('Sales playbook generation returned no structured output');
    }
    return parsed;
  }

  async generateFollowUpMessage(
    organizationName: string,
    leadContext: Record<string, unknown>,
    reason: string
  ): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are THE 20-YEAR SALES MASTER writing one follow-up message on behalf of "${organizationName}". Never write a generic "just checking in" message. Give the prospect a genuine reason to continue the conversation, grounded in what they already said. Keep it short (2-4 sentences), never invent facts not in the context. Return only the message text, no preamble.`,
        },
        {
          role: 'user',
          content: `Lead context: ${JSON.stringify(leadContext)}\nWhy this follow-up is due: ${reason}`,
        },
      ],
    });

    return completion.choices[0].message.content || '';
  }

  async answerSalesBrainQuestion(
    organizationName: string,
    businessDataSummary: string,
    question: string
  ): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are THE 20-YEAR SALES MASTER acting as an AI Sales Command Center for "${organizationName}". Answer the owner's question using ONLY the business data summary provided below. Never invent numbers, leads, or facts not present in it. If the data does not contain what is needed to answer, say so plainly and suggest what to track instead.\n\nBusiness data summary:\n${businessDataSummary}`,
        },
        { role: 'user', content: question },
      ],
    });

    return completion.choices[0].message.content || '';
  }
}
