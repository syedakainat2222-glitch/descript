'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, Music, Volume2, Rewind } from 'lucide-react';

import type { GenerationResult } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function Player({ scenes, voiceoverUrl, musicSuggestion }: GenerationResult) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const sceneDuration = (audioRef.current?.duration || 0) / scenes.length;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const newProgress = (audio.currentTime / audio.duration) * 100;
      setProgress(newProgress);
      const newSceneIndex = Math.min(scenes.length - 1, Math.floor(audio.currentTime / sceneDuration));
      setCurrentSceneIndex(newSceneIndex);
    };

    const handlePlaybackEnd = () => {
      setIsPlaying(false);
      setProgress(100);
      setCurrentSceneIndex(scenes.length - 1);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handlePlaybackEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handlePlaybackEnd);
    };
  }, [sceneDuration, scenes.length]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (audioRef.current.ended) {
          audioRef.current.currentTime = 0;
          setProgress(0);
          setCurrentSceneIndex(0);
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleRewind = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
    }
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressContainer = progressRef.current;
    const audio = audioRef.current;
    if (progressContainer && audio) {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newTime = (clickX / width) * audio.duration;
        audio.currentTime = newTime;
    }
  };


  const currentScene = scenes[currentSceneIndex];

  return (
    <Card className="w-full overflow-hidden shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Cinema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video w-full relative rounded-lg overflow-hidden bg-black">
          {currentScene && (
             <Image
                key={currentSceneIndex}
                src={currentScene.imageUrl}
                alt={currentScene.text}
                fill
                priority
                className="object-cover animate-in fade-in duration-500"
                data-ai-hint={currentScene.imageHint}
              />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        
        <div className="space-y-2">
            <Progress value={progress} className="h-2" ref={progressRef} onClick={handleProgressClick} />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{new Date( (audioRef.current?.currentTime || 0) * 1000).toISOString().substr(14, 5)}</span>
                <span>{new Date( (audioRef.current?.duration || 0) * 1000).toISOString().substr(14, 5)}</span>
            </div>
        </div>

        <audio ref={audioRef} src={voiceoverUrl} preload="auto" />

        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleRewind} aria-label="Rewind">
              <Rewind className="w-6 h-6" />
          </Button>
          <Button onClick={togglePlayPause} size="lg" className="rounded-full w-16 h-16 bg-accent hover:bg-accent/90">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Volume">
              <Volume2 className="w-6 h-6" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex items-center gap-4">
          <Music className="w-5 h-5 text-primary" />
          <p className="text-sm">
            <span className="font-semibold">Music Suggestion:</span>
            <span className="text-muted-foreground ml-2 font-code">{musicSuggestion}</span>
          </p>
      </CardFooter>
    </Card>
  );
}
