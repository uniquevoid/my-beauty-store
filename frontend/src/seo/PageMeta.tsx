import { Helmet } from 'react-helmet-async';

export type PageMetaOptions = {
  title: string;
  description?: string;
  noIndex?: boolean;
};

export function PageMeta({ title, description, noIndex }: PageMetaOptions) {
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex, follow" />}
    </Helmet>
  );
}
