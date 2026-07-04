interface NornickelLogoProps {
  className?: string;
}

export function NornickelLogo({ className = '' }: NornickelLogoProps) {
  return (
    <span className={`sidebar-wordmark ${className}`.trim()} aria-label="Soybean">
      Soybean
    </span>
  );
}
