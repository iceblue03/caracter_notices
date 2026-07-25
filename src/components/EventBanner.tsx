import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin } from 'lucide-react';
import { EventFeature, countdownLabel, formatEventDates } from '../events';
import { imageSrc } from '../lib/utils';

interface Props {
  /** Ordered soonest-first; the banner shows one at a time. */
  features: EventFeature[];
}

/**
 * Big hero banner above the home feed introducing a real event announced in one
 * of the collected posts.
 *
 * The source post's photo is composited as a cut-out: its left edge is feathered
 * away with a mask and it sits under a scrim of the event's accent colour, so it
 * reads as part of the banner instead of a pasted-in rectangle. Posts with no
 * photo (and photos that fail to load) fall back to the line-art illustration
 * below.
 */
export function EventBanner({ features }: Props) {
  const [index, setIndex] = useState(0);

  if (features.length === 0) return null;

  const position = Math.min(index, features.length - 1);
  const feature = features[position];
  const { event, post } = feature;
  const [accentFrom, accentTo] = event.accent;
  const step = (delta: number) =>
    setIndex((current) => (current + delta + features.length) % features.length);

  return (
    <section
      aria-label="추천 행사"
      className="relative isolate overflow-hidden rounded-3xl shadow-xl shadow-slate-300/50 mb-6"
      style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
    >
      <BannerArt key={event.id} accent={event.accent} imageUrl={post?.imageUrl} />

      <div className="relative px-6 py-7 sm:px-8 sm:py-9 sm:max-w-[62%]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-extrabold tracking-tight text-slate-900">
            {countdownLabel(feature)}
          </span>
          <span className="text-xs font-semibold text-white/80">{event.category}</span>
        </div>

        {/* break-keep: Korean otherwise wraps mid-word. */}
        <h2 className="mt-3 text-2xl sm:text-[32px] font-extrabold leading-[1.15] tracking-tight text-white break-keep drop-shadow-sm">
          {event.name}
        </h2>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold text-white/90">
          <Meta icon={<CalendarDays size={15} />}>{formatEventDates(event)}</Meta>
          {event.time && <Meta icon={<Clock size={15} />}>{event.time}</Meta>}
          {event.venue && <Meta icon={<MapPin size={15} />}>{event.venue}</Meta>}
        </div>

        <p className="mt-3.5 text-[15px] leading-relaxed text-white/85 break-keep">{event.summary}</p>

        {event.highlights.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {event.highlights.map((highlight) => (
              <li
                key={highlight}
                className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white break-keep backdrop-blur-sm"
              >
                {highlight}
              </li>
            ))}
          </ul>
        )}

        {post && (
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <a
              href={post.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white/90"
            >
              원본 소식 보기 <ExternalLink size={14} />
            </a>
            <span className="text-xs font-medium text-white/70">{post.handle} 게시물에서</span>
          </div>
        )}
      </div>

      {features.length > 1 && (
        <div className="relative flex items-center justify-between gap-3 px-6 pb-5 sm:px-8">
          <div className="flex items-center gap-1.5">
            {features.map((other, i) => (
              <button
                key={other.event.id}
                onClick={() => setIndex(i)}
                aria-label={`${other.event.name} 배너 보기`}
                aria-current={i === position}
                className={`h-1.5 rounded-full transition-all ${
                  i === position ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <PagerButton label="이전 행사" onClick={() => step(-1)}>
              <ChevronLeft size={17} />
            </PagerButton>
            <PagerButton label="다음 행사" onClick={() => step(1)}>
              <ChevronRight size={17} />
            </PagerButton>
          </div>
        </div>
      )}
    </section>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-white/70">{icon}</span>
      {children}
    </div>
  );
}

function PagerButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
    >
      {children}
    </button>
  );
}

/**
 * The banner's artwork layers: a blurred bleed of the post photo for ambient
 * colour, the photo itself cut out with a feathered mask, an accent scrim that
 * keeps the copy legible, and the line-art flourish on top.
 */
function BannerArt({ accent, imageUrl }: { accent: [string, string]; imageUrl?: string }) {
  const [failed, setFailed] = useState(false);
  const [from, to] = accent;
  const src = imageSrc(imageUrl);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {showPhoto && (
        <>
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-y-0 right-0 w-full sm:w-[64%]">
            <img
              src={src}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              style={{
                // Feathers the left edge so the photo dissolves into the
                // gradient instead of ending on a hard vertical line.
                maskImage: CUTOUT_MASK,
                WebkitMaskImage: CUTOUT_MASK,
              }}
            />
            {/* Top/bottom edges washed back into the banner gradient. Done by
                painting over rather than by a second mask layer, since
                mask-composite support is still patchy. */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${from}b3 0%, ${from}00 17%, ${to}00 80%, ${to}bf 100%)`,
              }}
            />
          </div>
        </>
      )}

      {!showPhoto && (
        <LineArtCutout className="absolute inset-y-0 right-0 hidden h-full w-[46%] text-white/70 sm:block" />
      )}

      {/* Accent scrim — near-opaque over the copy, clear over the cut-out. */}
      <div
        className="absolute inset-0 sm:hidden"
        style={{ background: `linear-gradient(180deg, ${from}f7, ${from}cc 55%, ${to}f5)` }}
      />
      <div
        className="absolute inset-0 hidden sm:block"
        style={{ background: `linear-gradient(100deg, ${from} 0%, ${from}f0 38%, ${from}00 80%)` }}
      />

      <BannerFlourish className="absolute inset-0 h-full w-full text-white/30" />
    </div>
  );
}

const CUTOUT_MASK = 'linear-gradient(100deg, transparent 2%, rgba(0,0,0,0.3) 24%, #000 56%)';

/** Decorative strokes drawn over the whole banner: streamers, rings, sparkles. */
function BannerFlourish({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 720 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
    >
      <g strokeWidth="1.5" strokeLinecap="round">
        <path d="M-20 40C80 88 168 12 262 54S446 108 540 32 690 66 748 24" />
        <path d="M-20 286C74 250 150 300 246 268S430 224 520 276 676 250 748 292" opacity="0.6" />
      </g>
      <g strokeWidth="1.25" opacity="0.55">
        <circle cx="612" cy="150" r="92" />
        <circle cx="612" cy="150" r="136" strokeDasharray="5 9" />
        <circle cx="612" cy="150" r="186" opacity="0.6" />
      </g>
      <g fill="currentColor" stroke="none">
        <Sparkle x={132} y={196} size={9} />
        <Sparkle x={470} y={58} size={12} />
        <Sparkle x={664} y={236} size={7} />
      </g>
    </svg>
  );
}

/** Line-art stand-in for posts with no usable photo: a ticket under an awning. */
function LineArtCutout({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 200"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Booth awning + posts */}
      <path d="M40 52a13 13 0 0126 0 13 13 0 0126 0 13 13 0 0126 0 13 13 0 0126 0" />
      <path d="M40 52v-9h156v9" />
      <path d="M48 52v96M192 52v96" opacity="0.5" />
      {/* Ticket */}
      <rect x="62" y="86" width="116" height="66" rx="12" />
      <path d="M146 86v66" strokeDasharray="4 7" />
      <path d="M78 108h52M78 124h34" opacity="0.75" />
      <g fill="currentColor" stroke="none">
        <Sparkle x={162} y={119} size={9} />
        <Sparkle x={30} y={74} size={8} />
        <Sparkle x={210} y={166} size={7} />
      </g>
    </svg>
  );
}

/** Four-point star, centred on (x, y). */
function Sparkle({ x, y, size }: { x: number; y: number; size: number }) {
  const arm = size / 3.4;
  return (
    <path
      d={`M${x} ${y - size}Q${x + arm} ${y - arm} ${x + size} ${y}Q${x + arm} ${y + arm} ${x} ${
        y + size
      }Q${x - arm} ${y + arm} ${x - size} ${y}Q${x - arm} ${y - arm} ${x} ${y - size}Z`}
    />
  );
}
