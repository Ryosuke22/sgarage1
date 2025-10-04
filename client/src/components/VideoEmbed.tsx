import { validateAndNormalizeVideoUrl } from '@/lib/utils';

interface VideoEmbedProps {
  videoUrl: string;
  className?: string;
  title?: string;
}

export function VideoEmbed({ videoUrl, className = "", title = "動画" }: VideoEmbedProps) {
  const embedUrl = validateAndNormalizeVideoUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-muted-foreground">
          動画URL: <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
            {videoUrl}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        data-testid="video-embed"
      />
    </div>
  );
}
