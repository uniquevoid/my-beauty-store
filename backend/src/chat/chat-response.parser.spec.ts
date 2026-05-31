import { parseChatResponse } from './chat-response.parser';

describe('chat-response.parser', () => {
  it('splits reply and chatsheet', () => {
    const raw =
      'We have **remote** roles open. **Summary:** Browse /jobs for listings.\n[Chatsheet] Remote jobs available; visit /jobs.';

    const result = parseChatResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.reply).toContain('**Summary:**');
      expect(result.parsed.chatsheet).toBe('Remote jobs available; visit /jobs.');
      expect(result.parsed.reply.length).toBeLessThanOrEqual(300);
    }
  });

  it('rejects reply over 300 characters', () => {
    const longBody = 'A'.repeat(295);
    const raw = `${longBody} **Summary:** Done.\n[Chatsheet] Short summary here.`;

    const result = parseChatResponse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('300');
    }
  });

  it('rejects chatsheet over 100 characters', () => {
    const raw = `Short answer here. **Summary:** Done.\n[Chatsheet] ${'x'.repeat(101)}`;

    const result = parseChatResponse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('100');
    }
  });

  it('rejects missing Summary or Conclusion', () => {
    const raw = 'Just an answer without ending section.\n[Chatsheet] Brief note.';

    const result = parseChatResponse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('Summary');
    }
  });

  it('accepts Conclusion section', () => {
    const raw =
      'Apply via our **careers** site. **Conclusion:** Visit /jobs to start.\n[Chatsheet] Apply online at /jobs.';

    const result = parseChatResponse(raw);
    expect(result.ok).toBe(true);
  });

  it('rejects missing chatsheet marker', () => {
    const raw = 'Answer only. **Summary:** That is all.';
    expect(parseChatResponse(raw).ok).toBe(false);
  });
});
