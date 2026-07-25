import { useState } from 'react';
import { MapPin, ExternalLink, Tag, ImageOff } from 'lucide-react';
import { Character, GoodsListing } from '../types';
import { CHARACTER_MAP } from '../characters';
import { formatPrice, imageSrc, relativeTime } from '../lib/utils';
import { CharacterChip } from './CharacterChip';

interface Props {
  listing: GoodsListing;
  onSelectCharacter?: (id: string) => void;
  /** 'grid' for the Goods tab's card grid, 'feed' for mixing into a post stream. */
  variant?: 'grid' | 'feed';
}

const PLATFORM_LABEL: Record<GoodsListing['platform'], string> = {
  danggeun: '당근마켓',
  bunjang: '번개장터',
};

const PLATFORM_STYLE: Record<GoodsListing['platform'], string> = {
  danggeun: 'text-orange-700 bg-orange-50',
  bunjang: 'text-blue-700 bg-blue-50',
};

function PlatformBadge({ platform }: { platform: GoodsListing['platform'] }) {
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PLATFORM_STYLE[platform]}`}>
      {PLATFORM_LABEL[platform]}
    </span>
  );
}

function ListingImage({ listing, className }: { listing: GoodsListing; className: string }) {
  const [failed, setFailed] = useState(!listing.imageUrl);
  if (failed || !listing.imageUrl) {
    return (
      <div className={`${className} grid place-items-center bg-slate-100 text-slate-300`}>
        <ImageOff size={22} />
      </div>
    );
  }
  return (
    <img
      src={imageSrc(listing.imageUrl)}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  );
}

/** A single 당근마켓/번개장터 goods listing. Always links out to the original listing. */
export function GoodsCard({ listing, onSelectCharacter, variant = 'grid' }: Props) {
  const matchedChars: Character[] = (listing.matches ?? [])
    .map((m) => CHARACTER_MAP[m.characterId])
    .filter((c): c is Character => Boolean(c) && c.id !== 'misc');

  if (variant === 'feed') {
    return (
      <article className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow flex gap-3 p-3">
        <a href={listing.link} target="_blank" rel="noreferrer" className="shrink-0">
          <ListingImage listing={listing} className="w-20 h-20 rounded-xl" />
        </a>
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <PlatformBadge platform={listing.platform} />
            <Tag size={11} className="text-slate-300" />
            <span className="text-[11px] text-slate-400">매물 · {relativeTime(listing.timestamp)}</span>
          </div>
          <a href={listing.link} target="_blank" rel="noreferrer" className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{listing.title}</p>
          </a>
          <p className="mt-1 font-extrabold text-slate-900">{formatPrice(listing.price, listing.priceLabel)}</p>
          {matchedChars.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {matchedChars.slice(0, 3).map((c) => (
                <CharacterChip key={c.id} character={c} size="sm" onClick={() => onSelectCharacter?.(c.id)} />
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <a
      href={listing.link}
      target="_blank"
      rel="noreferrer"
      className="group block bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow"
    >
      <div className="aspect-square relative">
        <ListingImage listing={listing} className="w-full h-full" />
        <span className="absolute top-2 left-2">
          <PlatformBadge platform={listing.platform} />
        </span>
        <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={13} />
        </span>
      </div>
      <div className="p-3">
        <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 h-10">{listing.title}</p>
        <p className="mt-1 font-extrabold text-slate-900">{formatPrice(listing.price, listing.priceLabel)}</p>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
          {listing.location && (
            <>
              <MapPin size={11} />
              <span className="truncate">{listing.location}</span>
              <span>·</span>
            </>
          )}
          <span>{relativeTime(listing.timestamp)}</span>
        </div>
        {matchedChars.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {matchedChars.slice(0, 2).map((c) => (
              // Stops the click from bubbling to the card's own <a>, so tapping
              // a chip opens that character instead of the marketplace listing.
              <span key={c.id} onClick={(e) => e.stopPropagation()}>
                <CharacterChip character={c} size="sm" onClick={() => onSelectCharacter?.(c.id)} />
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
