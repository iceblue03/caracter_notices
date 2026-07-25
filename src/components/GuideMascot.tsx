/**
 * 「오조」 — the onboarding guide.
 *
 * Original line art drawn as plain SVG paths (no third-party or licensed
 * artwork), so it ships with the bundle and recolours with the violet accent.
 * The only motion is a slow breath, an occasional blink, and two drifting
 * sparkles; `mood` swaps the eyes and mouth for a reaction to what the user
 * just picked.
 */
export function GuideMascot({ mood, className = '' }: { mood: 'idle' | 'happy'; className?: string }) {
  const happy = mood === 'happy';
  const line = '#7c3aed';

  return (
    <svg
      viewBox="0 0 200 210"
      className={className}
      role="img"
      aria-label={happy ? '안내 캐릭터 오조가 기뻐하고 있어요' : '안내 캐릭터 오조'}
    >
      <g
        className="ok-breathe"
        fill="none"
        stroke={line}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* hair mass, behind everything */}
        <path
          d="M100 20C62 20 44 48 44 86c0 32-5 68-14 106h140c-9-38-14-74-14-106 0-38-18-66-56-66Z"
          fill="#f3f0ff"
        />

        {/* neck, then shoulders */}
        <path d="M92 120v26h16v-26" fill="#fff" stroke="none" />
        <path d="M92 122v22M108 122v22" />
        <path
          d="M92 140c-4 7-10 11-17 13-15 5-25 19-30 41h110c-5-22-15-36-30-41-7-2-13-6-17-13"
          fill="#fff"
        />

        {/* face */}
        <path d="M69 86c0-23 14-37 31-37s31 14 31 37c0 22-14 41-31 41S69 108 69 86Z" fill="#fff" />

        {/* bangs + ahoge */}
        <path
          d="M67 88c-5-30 12-49 33-49s38 19 33 49c-3-17-11-28-21-32-3 12-11 18-19 16-7-2-13-9-15-17-6 8-10 19-11 33Z"
          fill="#f3f0ff"
        />
        <path d="M100 39c0-9 6-15 14-16-4 5-5 10-3 15" />

        {/* side locks, in front of the shoulders. Filled and outlined
            separately so the top edge tucks into the hair without a seam. */}
        <path d="M44 64C36 96 30 140 34 182c10-10 18-24 24-42 5-22 6-52 4-74Z" fill="#f3f0ff" stroke="none" />
        <path d="M44 64C36 96 30 140 34 182c10-10 18-24 24-42 5-22 6-52 4-74" />
        <path d="M156 64c8 32 14 76 10 118-10-10-18-24-24-42-5-22-6-52-4-74Z" fill="#f3f0ff" stroke="none" />
        <path d="M156 64c8 32 14 76 10 118-10-10-18-24-24-42-5-22-6-52-4-74" />

        {/* blush */}
        <ellipse cx="76" cy="105" rx="6.5" ry="3.6" fill="#e9d5ff" stroke="none" />
        <ellipse cx="124" cy="105" rx="6.5" ry="3.6" fill="#e9d5ff" stroke="none" />

        {/* brows */}
        <path d={happy ? 'M78 74q8-5 15-2' : 'M78 77q8-4 15-1'} strokeWidth={2.2} />
        <path d={happy ? 'M122 74q-8-5-15-2' : 'M122 77q-8-4-15-1'} strokeWidth={2.2} />

        {/* eyes — open ellipses that blink, or happy arcs */}
        {happy ? (
          <>
            <path d="M79 95q7-9 14 0" strokeWidth={3} />
            <path d="M107 95q7-9 14 0" strokeWidth={3} />
          </>
        ) : (
          <>
            <g className="ok-eye">
              <ellipse cx="86" cy="93" rx="7" ry="9" fill={line} stroke="none" />
              <circle cx="88.6" cy="89.4" r="2.7" fill="#fff" stroke="none" />
              <circle cx="83.4" cy="97" r="1.3" fill="#fff" stroke="none" opacity="0.85" />
            </g>
            <g className="ok-eye ok-eye-r">
              <ellipse cx="114" cy="93" rx="7" ry="9" fill={line} stroke="none" />
              <circle cx="116.6" cy="89.4" r="2.7" fill="#fff" stroke="none" />
              <circle cx="111.4" cy="97" r="1.3" fill="#fff" stroke="none" opacity="0.85" />
            </g>
          </>
        )}

        {/* mouth */}
        <path d={happy ? 'M94 108q6 9 12 0' : 'M95 110q5 4 10 0'} strokeWidth={2.2} />

        {/* sailor collar + ribbon */}
        <path d="M84 149 100 163 116 149" strokeWidth={2.2} />
        <path d="M100 165 88 158v14Z" fill="#ede9fe" />
        <path d="M100 165 112 158v14Z" fill="#ede9fe" />
        <circle cx="100" cy="165" r="4" fill={line} stroke="none" />
      </g>

      {/* drifting sparkles */}
      <g fill="#a78bfa" stroke="none">
        <path className="ok-orbit" d="M168 50l2.6 8 7.4 2.6-7.4 2.6-2.6 7.8-2.6-7.8-7.4-2.6 7.4-2.6Z" />
        <path
          className="ok-orbit"
          style={{ animationDelay: '-2.4s' }}
          d="M32 112l1.8 5.6 5.2 1.8-5.2 1.8-1.8 5.4-1.8-5.4-5.2-1.8 5.2-1.8Z"
          opacity="0.75"
        />
      </g>
    </svg>
  );
}
