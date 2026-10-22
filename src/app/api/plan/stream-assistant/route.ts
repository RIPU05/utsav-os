import { z } from 'zod';
import { eventPlanSchema } from '@/lib/schemas';
import { buildCreativeAssistantPrompt } from '@/lib/prompts';
import { streamGeminiContent } from '@/lib/gemini';
import { checkRequestSafety } from '@/lib/api-helper';
import { sanitizeObject } from '@/lib/sanitizer';

const assistantRequestSchema = z.object({
  promptType: z.enum(['invitation', 'menu', 'theme', 'runOfShow']),
  plan: eventPlanSchema,
  userNotes: z.string().max(400).optional().default(''),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const safety = checkRequestSafety(request);
  if (!safety.allowed) {
    return safety.response;
  }

  try {
    const rawJson = await request.json();
    const sanitized = sanitizeObject(rawJson);
    const { promptType, plan, userNotes } = assistantRequestSchema.parse(sanitized);

    const prompt = buildCreativeAssistantPrompt(promptType, plan, userNotes);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamGeminiContent(prompt)) {
            const data = JSON.stringify({ chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamErr) {
          const errMessage = streamErr instanceof Error ? streamErr.message : 'Streaming error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid assistant request';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
