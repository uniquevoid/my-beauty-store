import { buildCareerAssistantSystemPrompt } from './career-assistant.prompt';

describe('career-assistant.prompt', () => {
  it('injects app name and includes format rules', () => {
    const prompt = buildCareerAssistantSystemPrompt('Acme Careers', '{"jobs":[]}');

    expect(prompt).toContain('Career Assistant for Acme Careers');
    expect(prompt).toContain('under 300 characters');
    expect(prompt).toContain('[Chatsheet]');
    expect(prompt).toContain('**Summary:** or **Conclusion:**');
    expect(prompt).toContain('{"jobs":[]}');
  });
});
