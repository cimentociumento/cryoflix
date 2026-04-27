export const VideoHero = () => (
  <section className="video-hero">
    <video
      className="video-hero_player"
      controls
      poster="https://images.unsplash.com/photo-1458053688450-0a8a1209cedb?auto=format&fit=crop&w=1200&q=80"
    >
      <source
        src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"
        type="video/mp4"
      />
      Seu navegador não suporta vídeo HTML5.
    </video>
    <div className="video-hero_caption">
      <p>Streaming adaptativo</p>
      <strong>HLS + DRM + baixa latência</strong>
    </div>
  </section>
);

