'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseSrt, type Subtitle } from '@/lib/srt';
import type { Video } from '@/lib/types';
import { processVideo } from '@/ai/flows/process-video';
import { translateSubtitles } from '@/ai/flows/translate-subtitles';
import VideoUpload from './video-upload';
import EditorView from './editor-view';
import VideoLibrary from './video-library';
import { Timestamp } from 'firebase/firestore';

// A helper to convert VTT time string to seconds
const timeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 3) return 0;
  const secondsParts = parts[2].split('.');
  if (secondsParts.length !== 2) return 0;
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(secondsParts[0]) + parseInt(secondsParts[1]) / 1000;
};

const CaptionEditor = ({ video: initialVideo, onReset: onEditorReset }: { video?: Video, onReset?: () => void }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [video, setVideo] = useState<Video | null>(initialVideo || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideo?.videoUrl || null);
  const [videoPublicId, setVideoPublicId] = useState<string | null>(initialVideo?.publicId || null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [history, setHistory] = useState<Subtitle[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [language, setLanguage] = useState('auto');

  const [subtitleFont, setSubtitleFont] = useState('Arial');
  const [subtitleFontSize, setSubtitleFontSize] = useState(24);
  const [subtitleColor, setSubtitleColor] = useState('#FFFFFF');
  const [subtitleOutlineColor, setSubtitleOutlineColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const onReset = () => {
    setVideo(null);
    setVideoUrl(null);
    setVideoPublicId(null);
    setSubtitles([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (onEditorReset) onEditorReset();
  };

  const updateSubtitles = (newSubtitles: Subtitle[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newSubtitles]);
    setHistoryIndex(newHistory.length);
    setSubtitles(newSubtitles);
  };

  const handleVideoProcessing = useCallback(async (publicId: string, lang: string) => {
    setIsLoading(true);
    try {
      const result = await processVideo({ publicId, languageCode: lang });
      setVideoUrl(result.videoUrl);
      updateSubtitles(parseSrt(result.subtitles));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Processing failed',
        description: `Error: ${error.message}`,
      });
      onReset();
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleVideoUploaded = (result: { publicId: string; fileName: string; secureUrl: string }) => {
    const newVideo: Video = {
      id: result.publicId, 
      publicId: result.publicId,
      name: result.fileName,
      videoUrl: result.secureUrl,
      subtitles: [],
      userId: ' ', // Placeholder
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    setVideo(newVideo);
  };
  
  const onVideoSelect = useCallback((selectedVideo: Video) => {
    setVideo(selectedVideo);
  }, []);

  useEffect(() => {
    if (video) {
        setVideoUrl(video.videoUrl);
        setVideoPublicId(video.publicId);
        if (video.subtitles && video.subtitles.length > 0) {
            // Do not call updateSubtitles here to prevent loops
            setSubtitles(video.subtitles);
        } else if(video.publicId) {
            handleVideoProcessing(video.publicId, language);
        }
    }
  }, [video, language, handleVideoProcessing]);

  const onUpdateSubtitle = (id: number, newText: string) => {
    const newSubtitles = subtitles.map(sub => sub.id === id ? { ...sub, text: newText } : sub);
    updateSubtitles(newSubtitles);
  };

  const onUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setSubtitles(history[historyIndex - 1]);
    }
  };

  const onRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setSubtitles(history[historyIndex + 1]);
    }
  };

  const onPlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const onSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const onTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const onExportVideo = async () => {
    if (!video) return;
    setIsExporting(true);
    try {
        const response = await fetch('/api/export-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoPublicId: video.publicId,
                subtitles,
                videoName: video.name,
                subtitleFont,
                subtitleFontSize,
                subtitleColor,
                subtitleOutlineColor,
                isBold,
                isItalic,
                isUnderline,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to start export');
        }

        const { downloadUrl } = await response.json();

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = video?.name ? `subtitled_${video.name}` : 'subtitled_video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast({ title: 'Success', description: 'Video download started.' });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Export failed',
            description: `Error: ${error.message}`,
        });
    } finally {
        setIsExporting(false);
    }
  };

  const onSuggestCorrection = async (subtitle: Subtitle) => {
  };
  
  const onTranslate = async (targetLanguage: string) => {
    try {
      const newSubtitles = await translateSubtitles({ subtitles, targetLanguage });
      updateSubtitles(newSubtitles);
      toast({ title: 'Translation successful!', description: `Subtitles translated to ${targetLanguage}.` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Translation failed',
        description: `Error: ${error.message}`,
      });
    }
  };

  const onSplit = () => {
    const activeSubtitle = subtitles.find(s => currentTime >= timeToSeconds(s.startTime) && currentTime < timeToSeconds(s.endTime));
    if (activeSubtitle) {
      const splitTime = currentTime;

      const newSub1 = { ...activeSubtitle, endTime: '...', text: activeSubtitle.text.split(' ').slice(0, Math.floor(activeSubtitle.text.split(' ').length / 2)).join(' ') };
      const newSub2 = { ...activeSubtitle, id: Math.random(), startTime: '...', endTime: '...', text: activeSubtitle.text.split(' ').slice(Math.floor(activeSubtitle.text.split(' ').length / 2)).join(' ') };

      const newSubtitles = subtitles.filter(s => s.id !== activeSubtitle.id).concat([newSub1, newSub2]).sort((a,b) => timeToSeconds(a.startTime) - timeToSeconds(b.startTime));
      updateSubtitles(newSubtitles);
    }
  };

  const onDeleteSubtitle = (id: number) => {
    updateSubtitles(subtitles.filter(s => s.id !== id));
  };

  const onUpdateSubtitleTime = (id: number, startTime: string, endTime: string) => {
    const newSubtitles = subtitles.map(sub => 
      sub.id === id ? { 
        ...sub, 
        startTime: startTime,
        endTime: endTime,
       } : sub
    );
    updateSubtitles(newSubtitles);
  };

  const activeSubtitleId = subtitles.find(s => currentTime >= timeToSeconds(s.startTime) && currentTime < timeToSeconds(s.endTime))?.id || null;

  if (!video) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <VideoUpload 
                    onVideoSelect={handleVideoUploaded} 
                    isLoading={isLoading} 
                    language={language}
                    onLanguageChange={setLanguage}
                />
            </div>
            <div>
                <VideoLibrary onVideoSelect={onVideoSelect} currentVideoId={undefined} />
            </div>
        </div>
    );
}

  return (
    <EditorView 
      videoRef={videoRef}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      onPlayPause={onPlayPause}
      onSeek={onSeek}
      onLoadedMetadata={onLoadedMetadata}
      videoUrl={videoUrl!}
      videoPublicId={videoPublicId!}
      videoName={video.name}
      subtitles={subtitles}
      onUpdateSubtitles={updateSubtitles}
      activeSubtitleId={activeSubtitleId}
      onTimeUpdate={onTimeUpdate}
      onUpdateSubtitle={onUpdateSubtitle}
      onSuggestCorrection={onSuggestCorrection}
      onReset={onReset}
      isExporting={isExporting}
      onExportVideo={onExportVideo}
      subtitleFont={subtitleFont}
      subtitleFontSize={subtitleFontSize}
      subtitleColor={subtitleColor}
      subtitleOutlineColor={subtitleOutlineColor}
      isBold={isBold}
      isItalic={isItalic}
      isUnderline={isUnderline}
      onStyleChange={(update) => {
        if (update.subtitleFont) setSubtitleFont(update.subtitleFont);
        if (update.subtitleFontSize) setSubtitleFontSize(update.subtitleFontSize);
        if (update.subtitleColor) setSubtitleColor(update.subtitleColor);
        if (update.subtitleOutlineColor) setSubtitleOutlineColor(update.subtitleOutlineColor);
        if (update.isBold !== undefined) setIsBold(update.isBold);
        if (update.isItalic !== undefined) setIsItalic(update.isItalic);
        if (update.isUnderline !== undefined) setIsUnderline(update.isUnderline);
      }}
      onTranslate={onTranslate}
      onSplit={onSplit}
      onUndo={onUndo}
      onRedo={onRedo}
      canUndo={canUndo}
      canRedo={canRedo}
      onDeleteSubtitle={onDeleteSubtitle}
      onUpdateSubtitleTime={onUpdateSubtitleTime}
    />
  );
};

export default CaptionEditor;
