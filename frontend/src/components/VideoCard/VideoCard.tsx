import { Link } from 'react-router-dom';

type VideoSummary = {
  id: string | number;
  title: string;
  posterUrl?: string | null;
};

const getThumbnail = (id: string | number) => `https://picsum.photos/seed/${id}/600/340`;

type VideoCardProps = {
  video: VideoSummary;
  subtitle?: string;
};

export const VideoCard = ({ video, subtitle }: VideoCardProps) => {
  const href = `/watch/${video.id}`;
  const imageSrc = video.posterUrl ?? getThumbnail(video.id);

  return (
    <Link
      to={href}
      className="group block outline-none transition-transform duration-200 hover:scale-[1.03] focus-visible:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-velvet ring-1 ring-white/10 transition-shadow duration-200 group-hover:ring-2 group-hover:ring-marquee group-focus-visible:ring-2 group-focus-visible:ring-marquee motion-reduce:group-hover:ring-1">
        <img src={imageSrc} alt={video.title} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="pt-2">
        <strong className="block truncate text-sm font-medium text-bone">{video.title}</strong>
        {subtitle ? <small className="text-xs text-smoke">{subtitle}</small> : null}
      </div>
    </Link>
  );
};

