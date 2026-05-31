export type JobDescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export type JobDescriptionSection = {
  title: string | null;
  blocks: JobDescriptionBlock[];
};

const HEADING_PATTERN = /^## (.+)$/;
const BULLET_PATTERN = /^[-•*]\s+(.*)$/;

function parseBlocks(lines: string[]): JobDescriptionBlock[] {
  const blocks: JobDescriptionBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_PATTERN);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();
    blocks.push({ type: 'paragraph', text: trimmed });
  }

  flushList();
  return blocks;
}

export function parseJobDescription(description: string): JobDescriptionSection[] {
  const lines = description.split('\n');
  const sections: JobDescriptionSection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flushSection = () => {
    const blocks = parseBlocks(currentLines);
    if (blocks.length) {
      sections.push({ title: currentTitle, blocks });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
      flushSection();
      currentTitle = headingMatch[1].trim();
      continue;
    }
    currentLines.push(line);
  }

  flushSection();
  return sections;
}

export function plainTextFromDescription(description: string, max = 160): string {
  const withoutHeadings = description
    .split('\n')
    .filter((line) => !line.match(HEADING_PATTERN))
    .map((line) => line.replace(BULLET_PATTERN, '$1'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (withoutHeadings.length <= max) return withoutHeadings;
  return `${withoutHeadings.slice(0, max - 1).trim()}…`;
}
