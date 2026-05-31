import { isGenericTemplateCopy, isStubAboutBody } from './generic-copy-guard';

describe('generic-copy-guard', () => {
  it('flags ATS template about copy', () => {
    expect(
      isGenericTemplateCopy(
        'We build enterprise software that helps organizations manage talent and acquisition at scale.',
      ),
    ).toBe(true);
  });

  it('allows company-specific copy', () => {
    expect(
      isStubAboutBody(
        'We are a multidisciplinar technology company providing tech solutions and developing games.',
      ),
    ).toBe(false);
  });
});
