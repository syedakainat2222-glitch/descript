import { Header } from '@/components/header';
import { VideoGenerator } from '@/components/video-generator';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1">
        <VideoGenerator />
      </main>
    </div>
  );
}
