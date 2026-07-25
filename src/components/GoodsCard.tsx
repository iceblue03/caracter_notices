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
    // Same footprint as PostCard (header → body → full-width image → action
    // bar) so goods listings read as a peer of the feed, not a smaller,
    // visually distinct insert.
    return (
      <a
        href={listing.link}
        target="_blank"
        rel="noreferrer"
        className="group block bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-1.5">
              <PlatformBadge platform={listing.platform} />
              <Tag size={11} className="text-slate-300" />
              <span className="text-xs text-slate-400 font-medium">중고 매물</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{relativeTime(listing.timestamp)}</span>
          </div>

          {matchedChars.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
              {matchedChars.map((c) => (
                <CharacterChip key={c.id} character={c} size="sm" onClick={() => onSelectCharacter?.(c.id)} />
              ))}
            </div>
          )}

          <p className="font-bold text-slate-900 text-[15px] leading-snug">{listing.title}</p>
          <p className="mt-1.5 text-lg font-extrabold text-slate-900">
            {formatPrice(listing.price, listing.priceLabel)}
          </p>
          {listing.location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={11} />
              {listing.location}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50">
          <ListingImage listing={listing} className="w-full max-h-80" />
        </div>

        <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
            매물 보기 <ExternalLink size={14} />
          </span>
        </div>
      </a>
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
