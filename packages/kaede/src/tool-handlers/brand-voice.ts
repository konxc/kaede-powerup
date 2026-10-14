/**
 * KAEDE MCP — Brand Voice Tool Handler
 */

import { validateBrandVoice } from '../brand-voice';

export function handleValidateBrandVoice(args: Record<string, unknown>): Record<string, unknown> {
  const text = (args.text as string) || '';
  if (!text) {
    throw new Error('text is required for validate_brand_voice');
  }

  const result = validateBrandVoice(text, {
    openkbPath: args.openkbPath as string | undefined,
    brandVoicePath: args.brandVoicePath as string | undefined,
    persona: args.persona as string | undefined,
    channel: args.channel as 'seo-article' | 'social-media-post' | 'lead-funnel' | 'web-copy' | 'general' | undefined,
    customForbiddenWords: args.customForbiddenWords as string[] | undefined,
    minWords: args.minWords as number | undefined,
    maxWords: args.maxWords as number | undefined,
  });

  return result as unknown as Record<string, unknown>;
}
