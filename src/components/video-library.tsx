'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Film, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Video } from '@/lib/types';

interface VideoLibraryProps {
    onVideoSelect: (video: Video) => void;
    currentVideoId?: string;
}

export default function VideoLibrary({ onVideoSelect, currentVideoId }: VideoLibraryProps) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await axios.get('/api/videos');
                setVideos(response.data.videos);
            } catch (err) {
                setError('Failed to fetch video library');
                console.error(err);
            }
            setIsLoading(false);
        };

        fetchVideos();
        const interval = setInterval(fetchVideos, 15000);

        return () => clearInterval(interval);

    }, []);

    const openInNewTab = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };


    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center p-4 text-red-500">
                {error}
            </div>
        );
    }

    return (
        <Card className="h-full w-full">
            <CardHeader>
                <CardTitle>Video Library</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[calc(100vh-14rem)]">
                    <div className="space-y-4">
                        {videos.map((video) => (
                            <Card
                                key={video.id}
                                className={`cursor-pointer transition-colors hover:bg-muted/50 ${currentVideoId === video.id ? 'bg-muted' : ''}`}>
                                <CardContent className="flex items-center gap-4 p-4" onClick={() => onVideoSelect(video)}>
                                    <Film className="h-8 w-8 text-muted-foreground" />
                                    <div className="flex-grow overflow-hidden">
                                        <p className="truncate font-medium">{video.name}</p>
                                        <div className="mt-1">
                                            <Badge
                                                variant={video.status === 'ready' ? 'success' : video.status === 'failed' ? 'destructive' : 'secondary'}
                                            >
                                                {video.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!video.vttUrl}
                                            onClick={(e) => { e.stopPropagation(); openInNewTab(video.vttUrl!); }}
                                            aria-label="Open VTT file"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="ml-2">VTT</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!video.srtUrl}
                                            onClick={(e) => { e.stopPropagation(); openInNewTab(video.srtUrl!); }}
                                            aria-label="Open SRT file"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="ml-2">SRT</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!video.txtUrl}
                                            onClick={(e) => { e.stopPropagation(); openInNewTab(video.txtUrl!); }}
                                            aria-label="Open TXT file"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="ml-2">TXT</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
