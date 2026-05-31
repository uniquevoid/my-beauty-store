export type BoldSegment = { bold: boolean; text: string };

export function parseInlineBold(text: string): BoldSegment[] {
  const segments: BoldSegment[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ bold: false, text: text.slice(lastIndex, match.index) });
    }
    segments.push({ bold: true, text: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ bold: false, text: text.slice(lastIndex) });
  }

  if (!segments.length) {
    segments.push({ bold: false, text });
  }

  return segments;
}
