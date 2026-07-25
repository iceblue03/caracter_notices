interface Props {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}

/** Shared pill toggle used by the filter rails in FeedView and GoodsView. */
export function FilterPill({ active, onClick, children, compact }: Props) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full font-semibold border transition-colors ${
        compact ? 'px-3 py-1 text-xs' : 'pl-1 pr-3 py-1 text-sm'
      } ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
