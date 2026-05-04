import { Link } from 'react-router-dom';

type VideoSummary = {
  id: string | number;
  title: string;
  description?: string | null;
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
    <Link to={href} className="video-card">
      <img src={imageSrc} alt={video.title} loading="lazy" />
      <div className="video-card_content">
        <strong>{video.title}</strong>
        {video.description ? <p>{video.description}</p> : null}
        {subtitle ? <small>{subtitle}</small> : null}
      </div>
    </Link>
  );
};

