import * as React from 'react';

// Counts down from an end time rather than decrementing, so it stays correct if the app was backgrounded.
export function useCountdown(initialSeconds: number) {
  const [endsAt, setEndsAt] = React.useState(() => Date.now() + initialSeconds * 1000);
  const [now, setNow] = React.useState(Date.now);

  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const running = secondsLeft > 0;

  React.useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const restart = React.useCallback((seconds: number) => {
    setNow(Date.now());
    setEndsAt(Date.now() + seconds * 1000);
  }, []);

  return { secondsLeft, restart };
}

export function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
