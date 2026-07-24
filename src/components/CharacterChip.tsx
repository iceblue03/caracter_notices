import { Character } from '../types';

interface Props {
  character: Character;
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'md';
}

/** A small pill showing a character, tinted with the character's accent color. */
export function CharacterChip({ character, onClick, active, size = 'md' }: Props) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-sm gap-1.5';
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center rounded-full font-semibold transition-colors ${pad} ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{
        color: active ? '#fff' : character.color,
        backgroundColor: active ? character.color : `${character.color}1a`,
      }}
    >
      <span aria-hidden>{character.emoji}</span>
      <span>{character.name}</span>
    </button>
  );
}
