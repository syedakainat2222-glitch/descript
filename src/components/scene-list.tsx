import { Film } from 'lucide-react';
import type { Scene } from '@/lib/types';
import { SceneCard } from './scene-card';

interface SceneListProps {
  scenes: Scene[];
}

export function SceneList({ scenes }: SceneListProps) {
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-bold font-headline">
        <Film className="w-5 h-5 text-primary" />
        Scenes
      </h2>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          {scenes.map((scene, index) => (
            <SceneCard key={index} scene={scene} index={index} />
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
