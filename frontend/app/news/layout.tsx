import { Playfair_Display, Lora, JetBrains_Mono } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'block',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'block',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'block',
});

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${lora.variable} ${jetbrains.variable}`}>
      <style>{`
        .np-serif  { font-family: var(--font-playfair), 'Times New Roman', serif; }
        .np-body   { font-family: var(--font-lora), Georgia, serif; }
        .np-mono   { font-family: var(--font-jetbrains), 'Courier New', monospace; }

        .np-dot-bg {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
        }

        /* Breaking ticker animation */
        .np-ticker-track {
          animation: npTicker 40s linear infinite;
          will-change: transform;
        }
        .np-ticker-wrap:hover .np-ticker-track {
          animation-play-state: paused;
        }
        @keyframes npTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* Grayscale + sepia hover */
        .np-img { filter: grayscale(100%); transition: filter 0.35s ease, transform 0.45s ease; }
        .np-img:hover { filter: grayscale(20%) sepia(35%); }

        /* Scale on parent hover */
        .np-card:hover .np-img { transform: scale(1.05); }

        /* Drop cap for hero description */
        .np-drop-cap::first-letter {
          float: left;
          font-family: var(--font-playfair), 'Times New Roman', serif;
          font-size: 4.8rem;
          font-weight: 900;
          line-height: 0.8;
          margin-right: 0.06em;
          margin-top: 0.08em;
          color: #111111;
        }
      `}</style>
      {children}
    </div>
  );
}
