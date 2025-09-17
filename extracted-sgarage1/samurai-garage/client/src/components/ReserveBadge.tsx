import { Badge } from "@/components/ui/badge";

interface ReserveBadgeProps {
  reserveState: 'none' | 'met' | 'not_met';
  className?: string;
}

export function ReserveBadge({ reserveState, className = "" }: ReserveBadgeProps) {
  if (reserveState === 'none') {
    return null;
  }
  
  const isMet = reserveState === 'met';
  
  return (
    <Badge 
      variant={isMet ? "default" : "secondary"}
      className={`
        ${isMet 
          ? "bg-green-600 text-white hover:bg-green-700" 
          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300"
        }
        font-medium text-xs
        ${className}
      `}
      data-testid={`reserve-badge-${reserveState}`}
    >
      {isMet ? "リザーブ達成" : "リザーブ未達成"}
    </Badge>
  );
}