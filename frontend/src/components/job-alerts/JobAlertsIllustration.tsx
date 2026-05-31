import { resolveSectionStockImage } from '../../config/section-stock-images';

export default function JobAlertsIllustration({
  className = '',
  imageUrl,
  fallbackImageUrl = resolveSectionStockImage('jobAlerts'),
}: {
  className?: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
}) {
  const src = imageUrl?.trim() || fallbackImageUrl;

  return (
    <img
      src={src}
      alt=""
      className={`w-full max-w-md mx-auto aspect-[4/3] object-cover rounded-2xl ${className}`}
    />
  );
}
