interface NornickelLogoProps {
  className?: string;
}

const LOGO_SRC = '/brand/nornickel-logo.png';

export function NornickelLogo({ className = '' }: NornickelLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Норникель"
      className={className}
      width={168}
      height={36}
      decoding="async"
    />
  );
}
