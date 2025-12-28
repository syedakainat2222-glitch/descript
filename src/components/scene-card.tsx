import Image from 'next/image';
import type { Scene } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SceneCardProps {
  scene: Scene;
  index: number;
}

export function SceneCard({ scene, index }: SceneCardProps) {
  return (
    <Card className="w-64 shrink-0 shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="aspect-video relative">
          <Image
            src={scene.imageUrl}
            alt={scene.text}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={scene.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-sm font-semibold mb-2">Scene {index + 1}</CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-3">{scene.text}</p>
      </CardContent>
    </Card>
  );
}
