interface BrainMarkProps {
  size?: number;
}

export function BrainMark({ size = 26 }: BrainMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line x1="16" y1="8" x2="8" y2="21" stroke="#6D5CE6" strokeWidth="1.6" />
      <line x1="16" y1="8" x2="24" y2="21" stroke="#6D5CE6" strokeWidth="1.6" />
      <line x1="8" y1="21" x2="24" y2="21" stroke="#6D5CE6" strokeWidth="1.6" />
      <line x1="16" y1="8" x2="16" y2="17" stroke="#6D5CE6" strokeWidth="1.6" />
      <circle cx="16" cy="8" r="3.4" fill="#6D5CE6" />
      <circle cx="8" cy="21" r="3.4" fill="#6D5CE6" />
      <circle cx="24" cy="21" r="3.4" fill="#6D5CE6" />
      <circle cx="16" cy="17" r="2.4" fill="#B7AEF5" />
    </svg>
  );
}
