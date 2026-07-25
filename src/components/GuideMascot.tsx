import { getBackgroundImage } from '../workBackgrounds';

/**
 * The onboarding guide's portrait — reuses the official Hatsune Miku render
 * already bundled for the "하츠네 미쿠" work card (see `workBackgrounds.ts`),
 * rather than an invented character, so there's a single source of truth for
 * the artwork and it stays in sync with however that asset is licensed/served.
 */
const GUIDE_IMAGE = getBackgroundImage('하츠네 미쿠');

interface Props {
  mood: 'idle' | 'happy';
  /** 'contain' renders the full standee (desktop). 'cover' fills a fixed-size
   *  crop container, head-and-shoulders framed via `object-top` (mobile). */
  fit?: 'contain' | 'cover';
  className?: string;
}

export function GuideMascot({ mood, fit = 'contain', className = '' }: Props) {
  return (
    <span className={`relative block ${fit === 'cover' ? 'h-full w-full' : ''} ${className}`}>
      <img
        src={GUIDE_IMAGE}
        alt="안내 캐릭터 하츠네 미쿠"
        className={`ok-breathe block transition-transform duration-300 ${
          fit === 'cover'
            ? 'h-full w-full object-cover object-top'
            : 'w-full drop-shadow-[0_18px_28px_rgba(124,58,237,0.22)]'
        } ${mood === 'happy' ? 'scale-[1.04] -rotate-1' : ''}`}
      />
      {mood === 'happy' && (
        <span aria-hidden className="ok-pop absolute -right-1 top-2 text-2xl sm:-right-2 sm:top-4">
          💜
        </span>
      )}
    </span>
  );
}
