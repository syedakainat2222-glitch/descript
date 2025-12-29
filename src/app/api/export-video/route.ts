import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ffmpeg from 'ffmpeg-static';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { Subtitle } from '@/lib/srt';

// Helper function to convert subtitles to ASS format
function toAss(subtitles: Subtitle[], styles: any): string {
    let ass = `[Script Info]\nTitle: ${styles.videoName || 'Subtitled Video'}\nScriptType: v4.00+\nWrapStyle: 0\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,${styles.subtitleFont},${styles.subtitleFontSize},&H00${styles.subtitleColor.substring(5, 7)}${styles.subtitleColor.substring(3, 5)}${styles.subtitleColor.substring(1, 3)},&H00FFFFFF,&H00${styles.subtitleOutlineColor.substring(5, 7)}${styles.subtitleOutlineColor.substring(3, 5)}${styles.subtitleOutlineColor.substring(1, 3)},&H00000000,${styles.isBold ? -1 : 0},${styles.isItalic ? -1 : 0},${styles.isUnderline ? -1 : 0},0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    for (const sub of subtitles) {
        ass += `Dialogue: 0,${sub.startTime.replace(',', '.')},${sub.endTime.replace(',', '.')},Default,,0,0,0,,${sub.text}\n`;
    }
    return ass;
}

export async function POST(req: NextRequest) {
    try {

        if (!ffmpeg) {
            throw new Error('FFmpeg binary not found.');
        }

        const body = await req.json();
        const { videoPublicId, subtitles, videoName, subtitleFont, subtitleFontSize, subtitleColor, subtitleOutlineColor, isBold, isItalic, isUnderline, } = body;

        // 1. Download video from Supabase using the admin client
        const { data: videoData, error: downloadError } = await supabaseAdmin.storage
            .from('videos')
            .download(videoPublicId);

        if (downloadError) {
            throw new Error(`Failed to download video: ${downloadError.message}`);
        }

        const tempDir = path.join('/tmp', 'video-processing');
        await fs.mkdir(tempDir, { recursive: true });
        const videoBuffer = Buffer.from(await videoData.arrayBuffer());
        const inputVideoPath = path.join(tempDir, videoName);
        await fs.writeFile(inputVideoPath, videoBuffer);

        // 2. Create ASS subtitle file
        const assSubtitles = toAss(subtitles, { videoName, subtitleFont, subtitleFontSize, subtitleColor, subtitleOutlineColor, isBold, isItalic, isUnderline });
        const subtitlePath = path.join(tempDir, 'subtitles.ass');
        await fs.writeFile(subtitlePath, assSubtitles);

        // 3. Run FFmpeg to burn subtitles
        const outputVideoName = `subtitled_${videoName}`;
        const outputVideoPath = path.join(tempDir, outputVideoName);
        const ffmpegPath = ffmpeg.replace(/\\/g, '/');
        const finalSubtitlePath = subtitlePath.replace(/\\/g, '/');
        const finalInputVideoPath = inputVideoPath.replace(/\\/g, '/');
        const finalOutputVideoPath = outputVideoPath.replace(/\\/g, '/');
        const ffmpegCommand = `"${ffmpegPath}" -i "${finalInputVideoPath}" -vf "ass='${finalSubtitlePath}'" -c:a copy "${finalOutputVideoPath}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`FFmpeg error: ${error.message}`);
                    console.error(`FFmpeg stderr: ${stderr}`);
                    reject(new Error(`Failed to burn subtitles: ${stderr}`));
                    return;
                }
                resolve(stdout);
            });
        });

        // 4. Upload processed video to Supabase using the admin client
        const processedVideoBuffer = await fs.readFile(outputVideoPath);
        const uploadPath = `processed/${outputVideoName}`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('videos')
            .upload(uploadPath, processedVideoBuffer, {
                contentType: 'video/mp4',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Failed to upload processed video: ${uploadError.message}`);
        }

        // 5. Get public URL for the processed video using the admin client
        const { data: publicUrlData } = supabaseAdmin.storage
            .from('videos')
            .getPublicUrl(uploadPath);

        if (!publicUrlData) {
            throw new Error('Failed to get public URL for the processed video.');
        }

        // 6. Clean up temporary files
        await fs.unlink(inputVideoPath);
        await fs.unlink(subtitlePath);
        await fs.unlink(outputVideoPath);

        return NextResponse.json({ downloadUrl: publicUrlData.publicUrl });

    } catch (error: any) {
        console.error('Error in export-video endpoint:', error);
        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
