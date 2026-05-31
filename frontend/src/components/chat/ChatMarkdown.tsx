import { Fragment } from 'react';
import { parseInlineBold } from '../../utils/parseInlineBold';

type ChatMarkdownProps = {
  content: string;
  className?: string;
};

export default function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {parseInlineBold(line).map((segment, segmentIndex) =>
            segment.bold ? (
              <strong key={segmentIndex}>{segment.text}</strong>
            ) : (
              <Fragment key={segmentIndex}>{segment.text}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </div>
  );
}
