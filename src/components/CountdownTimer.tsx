"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  targetDate: string | Date;
  onExpire?: () => void;
}

export default function CountdownTimer({ targetDate, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    days: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    function calculate() {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
        <Clock className="w-3.5 h-3.5" />
        <span>Palpites Encerrados</span>
      </div>
    );
  }

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-arena-900/90 border border-pitch-green/30 px-3 py-1.5 rounded-xl shadow-glow">
        <Clock className="w-4 h-4 text-pitch-green animate-pulse" />
        <div className="flex items-center gap-1 font-mono text-xs md:text-sm font-bold text-white">
          {timeLeft.days > 0 && (
            <>
              <span className="text-pitch-green">{timeLeft.days}d</span>
              <span className="text-gray-500">:</span>
            </>
          )}
          <span>{formatNumber(timeLeft.hours)}h</span>
          <span className="text-gray-500">:</span>
          <span>{formatNumber(timeLeft.minutes)}m</span>
          <span className="text-gray-500">:</span>
          <span className="text-pitch-green">{formatNumber(timeLeft.seconds)}s</span>
        </div>
      </div>
    </div>
  );
}
