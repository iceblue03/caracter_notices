import { Character } from '../types';
import { gradientStyle } from '../lib/utils';

interface Props {
  character: Character;
  size?: number;
  onClick?: () => void;
  ring?: boolean;
  className?: string;
}

/** Character avatar: displays profile image if available, otherwise emoji on gradient. */
export function CharacterAvatar({ character, size = 44, onClick, ring, className }: Props) {
  const Tag = onClick ? 'button' : 'div';

  if (character.avatarImage) {
    return (
      <Tag
        onClick={onClick}
        title={character.name}
        className={`shrink-0 rounded-full overflow-hidden flex-shrink-0 select-none ${
          onClick ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''
        } ${ring ? 'ring-2 ring-white shadow-md' : ''} ${className ?? ''}`}
        style={{
          width: size,
          height: size,
        }}
      >
        <img
          src={character.avatarImage}
          alt={character.name}
          className="w-full h-full object-cover"
        />
      </Tag>
    );
  }

  return (
    <Tag
      onClick={onClick}
      title={character.name}
      className={`shrink-0 grid place-items-center rounded-full text-white select-none ${
        onClick ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''
      } ${ring ? 'ring-2 ring-white shadow-md' : ''} ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: gradientStyle(character.gradient),
      }}
    >
      <span aria-hidden>{character.emoji}</span>
    </Tag>
  );
}
