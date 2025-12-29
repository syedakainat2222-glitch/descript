import type { Timestamp } from "firebase/firestore";
import type { Subtitle } from "./srt";

export type Video = {
    id: string;
    name: string;
    videoUrl: string;
    publicId: string; 
    subtitles: Subtitle[];
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    // Optional fields from video processing
    status?: 'processing' | 'ready' | 'failed';
    vttUrl?: string;
    srtUrl?: string;
    txtUrl?: string;
    // Optional styling fields
    subtitleFont?: string;
    subtitleFontSize?: number;
    subtitleColor?: string;
    subtitleOutlineColor?: string;
    subtitleBackgroundColor?: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
};

export type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
};
