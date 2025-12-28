'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, PenSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { generateCinema } from '@/app/actions';
import type { ActionState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Player } from '@/components/player';
import { SceneList } from '@/components/scene-list';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const initialState: ActionState = {
  data: null,
  error: null,
  status: 'initial',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Cinema
        </>
      )}
    </Button>
  );
}

export function VideoGenerator() {
  const [state, formAction] = useFormState(generateCinema, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === 'error' && state.error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: state.error,
      });
    }
  }, [state, toast]);
  
  const initialImage = PlaceHolderImages.find(img => img.id === 'initial-view');

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="script" className="flex items-center gap-2 text-lg font-semibold font-headline">
                <PenSquare className="w-5 h-5 text-primary" />
                Your Script
              </label>
              <Textarea
                id="script"
                name="script"
                placeholder="e.g., A man walks into a cafe. He orders coffee. He sits by the window."
                defaultValue="A man walks into a cafe. He orders coffee. He sits by the window."
                className="min-h-[200px] text-base resize-none"
                required
              />
            </div>
            <SubmitButton />
          </form>
        </div>

        <div className="lg:col-span-3">
          <div className="w-full space-y-6">
            {state.status === 'pending' && (
              <div className="space-y-6">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/4" />
                   <div className="flex gap-4 overflow-hidden pb-2">
                      <Skeleton className="w-48 h-32 rounded-md shrink-0" />
                      <Skeleton className="w-48 h-32 rounded-md shrink-0" />
                      <Skeleton className="w-48 h-32 rounded-md shrink-0" />
                   </div>
                </div>
              </div>
            )}
            
            {state.status === 'initial' && initialImage && (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-card">
                 <Image
                    src={initialImage.imageUrl}
                    alt={initialImage.description}
                    width={640}
                    height={360}
                    data-ai-hint={initialImage.imageHint}
                    className="rounded-md object-cover aspect-video mb-4 shadow-lg"
                  />
                <h2 className="text-2xl font-bold font-headline mb-2">Bring Your Story to Life</h2>
                <p className="text-muted-foreground max-w-md">
                  Write a script, and our AI will instantly create a video with scenes, voiceover, and music.
                </p>
              </div>
            )}

            {state.status === 'success' && state.data && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <Player {...state.data} />
                <SceneList scenes={state.data.scenes} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
