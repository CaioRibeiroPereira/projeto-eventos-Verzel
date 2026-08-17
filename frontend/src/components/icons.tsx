type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.6 1.4l-8 8a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.8l8-8A2 2 0 0 1 12 3Z" />
      <circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" className={className}>
      <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.4 1.5-6.8-5.2-4.7 6.9-.7Z" />
    </svg>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="3" width="10" height="18" />
      <rect x="14" y="9" width="6" height="12" />
      <path d="M7 7h1M7 11h1M7 15h1M10 7h1M10 11h1M10 15h1M17 13h1M17 17h1" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </svg>
  );
}

export function PixIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8.3 3.8a3 3 0 0 1 2.1.9l1.1 1.1a1 1 0 0 0 1.4 0l1.1-1.1a3 3 0 0 1 2.1-.9h1" />
      <path d="M8.3 20.2a3 3 0 0 0 2.1-.9l1.1-1.1a1 1 0 0 1 1.4 0l1.1 1.1a3 3 0 0 0 2.1.9h1" />
      <path d="M3.8 8.3a3 3 0 0 0-.9 2.1v3.2a3 3 0 0 0 .9 2.1" />
      <path d="M20.2 8.3a3 3 0 0 1 .9 2.1v3.2a3 3 0 0 1-.9 2.1" />
      <rect x="10" y="10" width="4" height="4" rx="0.8" transform="rotate(45 12 12)" />
    </svg>
  );
}

export function BarcodeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 5v14M6 5v14M8 5v14M11 5v14M14 5v14M16 5v14M19 5v14M21 5v14" />
    </svg>
  );
}

export function WheelchairIcon({
  className,
  style,
}: IconProps & { style?: React.CSSProperties }) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none" />
      <path d="M11 7v5l5 3" />
      <path d="M8 10h6" />
      <path d="M11 12l-2 3a5 5 0 1 0 7 5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
