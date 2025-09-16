import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: string | Date;
  isEnded?: boolean;
}

export default function CountdownTimer({ endTime, isEnded }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(isEnded || false);

  useEffect(() => {
    if (isEnded) {
      setIsExpired(true);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime, isEnded]);

  const formatTime = () => {
    if (isExpired) return "終了";
    
    if (timeLeft.days > 0) {
      return `${timeLeft.days}日 ${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
    } else {
      return `${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div 
      className={`text-white px-3 py-2 rounded-lg text-center ${
        isExpired 
          ? "bg-gray-400" 
          : "bg-gradient-to-r from-red-500 to-red-600"
      }`}
    >
      <div className="text-sm font-medium">残り時間</div>
      <div className="text-lg font-bold" data-testid="countdown-display">
        {formatTime()}
      </div>
    </div>
  );
}
