import { Fragment } from 'react';
import { parseInlineBold } from '../utils/parseInlineBold';
import { parseJobDescription, type JobDescriptionBlock } from '../utils/parseJobDescription';

type JobDescriptionContentProps = {
  description: string;
  className?: string;
};

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInlineBold(text).map((segment, index) =>
        segment.bold ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}

function BlockContent({ block }: { block: JobDescriptionBlock }) {
  if (block.type === 'list') {
    return (
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {block.items.map((item, index) => (
          <li key={index} className="text-gray-700">
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-3 text-gray-700 leading-relaxed">
      <InlineText text={block.text} />
    </p>
  );
}

export default function JobDescriptionContent({ description, className }: JobDescriptionContentProps) {
  const sections = parseJobDescription(description);

  if (!sections.length) {
    return <p className="text-gray-500">No description provided.</p>;
  }

  return (
    <div className={className}>
      {sections.map((section, sectionIndex) => (
        <section key={sectionIndex} className={sectionIndex > 0 ? 'mt-10' : undefined}>
          <h2 className="text-lg font-semibold text-charcoal">
            {section.title ?? 'Description'}
          </h2>
          {section.blocks.map((block, blockIndex) => (
            <BlockContent key={blockIndex} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
