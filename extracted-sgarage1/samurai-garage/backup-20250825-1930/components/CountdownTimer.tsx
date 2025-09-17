import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: Date;
  className?: string;
}

export default function CountdownTimer({ endTime, className = "" }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const remaining = Math.max(0, end - now);
      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return "終了";

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}日 ${hours}時間 ${minutes}分`;
    } else if (hours > 0) {
      return `${hours}時間 ${minutes}分 ${seconds}秒`;
    } else if (minutes > 0) {
      return `${minutes}分 ${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const isUrgent = timeRemaining > 0 && timeRemaining < 3600000; // Less than 1 hour
  const isEnded = timeRemaining <= 0;

  return (
    <div className={`${className}`} data-testid="countdown-timer">
      <p 
        className={`text-2xl font-bold ${
          isEnded 
            ? 'text-gray-500' 
            : isUrgent 
            ? 'text-red-600' 
            : 'text-gray-900'
        }`}
      >
        {formatTime(timeRemaining)}
      </p>
      {isUrgent && !isEnded && (
        <p className="text-xs text-red-600 font-medium animate-pulse">
          もうすぐ終了
        </p>
      )}
    </div>
  );
}
