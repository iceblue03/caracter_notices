import { Home, Compass, Plus, Sparkles, ShoppingBag } from 'lucide-react';
import { Character } from '../types';
import { CharacterAvatar } from './CharacterAvatar';

type Active = 'feed' | 'discover' | 'goods' | 'character';

interface Props {
  active: Active;
  activeCharacterId?: string;
  subscribed: Character[];
  onFeed: () => void;
  onDiscover: () => void;
  onGoods: () => void;
  onSelectCharacter: (id: string) => void;
}

export function Sidebar({
  active,
  activeCharacterId,
  subscribed,
  onFeed,
  onDiscover,
  onGoods,
  onSelectCharacter,
}: Props) {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white/80 backdrop-blur">
      {/* Brand */}
      <button onClick={onFeed} className="flex items-center gap-2.5 px-5 h-16 shrink-0">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
          <Sparkles size={18} />
        </span>
        <span className="text-left leading-none">
          <span className="block text-lg font-extrabold tracking-tight text-slate-900">오조사마</span>
          <span className="block text-[11px] text-slate-400 font-medium mt-0.5">Ojosama</span>
        </span>
      </button>

      {/* Primary nav */}
      <nav className="px-3 space-y-1">
        <NavItem icon={<Home size={19} />} label="홈 피드" active={active === 'feed'} onClick={onFeed} />
        <NavItem
          icon={<Compass size={19} />}
          label="캐릭터 탐색"
          active={active === 'discover'}
          onClick={onDiscover}
        />
        <NavItem
          icon={<ShoppingBag size={19} />}
          label="굿즈"
          active={active === 'goods'}
          onClick={onGoods}
        />
      </nav>

      {/* My characters */}
      <div className="mt-6 px-5 flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">내 캐릭터</h2>
        <button
          onClick={onDiscover}
          className="text-slate-400 hover:text-violet-600 transition-colors"
          title="캐릭터 추가"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="mt-2 px-3 flex-1 overflow-y-auto">
        {subscribed.length === 0 ? (
          <button
            onClick={onDiscover}
            className="w-full text-left px-2 py-3 text-sm text-slate-400 hover:text-violet-600 transition-colors"
          >
            아직 구독한 캐릭터가 없어요.<br />
            <span className="font-semibold">캐릭터를 추가</span>해보세요 →
          </button>
        ) : (
          <ul className="space-y-0.5 pb-4">
            {subscribed.map((c) => {
              const isActive = active === 'character' && activeCharacterId === c.id;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectCharacter(c.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <CharacterAvatar character={c} size={30} />
                    <span className="min-w-0 text-left">
                      <span className="block text-sm font-semibold text-slate-800 truncate">
                        {c.name}
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate">{c.series}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[15px] transition-colors ${
        active
          ? 'bg-violet-50 text-violet-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
