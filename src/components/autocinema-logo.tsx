import { Clapperboard } from 'lucide-react';

export function AutoCinemaLogo() {
  return (
    <div className="flex items-center gap-2">
      <Clapperboard className="h-8 w-8 text-primary" />
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl font-headline">
        AutoCinema
      </h1>
    </div>
  );
}
