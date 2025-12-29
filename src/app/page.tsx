'use client';

import { useState } from 'react';
import CaptionEditor from '@/components/caption-editor';
import type { Video } from '@/lib/types';

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleReset = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <CaptionEditor 
          video={selectedVideo || undefined} 
          onReset={handleReset} 
        />
    </div>
  );
}
