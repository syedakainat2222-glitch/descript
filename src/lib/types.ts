export type Scene = {
  text: string;
  imageUrl: string;
  imageHint: string;
};

export type GenerationResult = {
  scenes: Scene[];
  voiceoverUrl: string;
  musicSuggestion: string;
};

export type ActionState = {
  data: GenerationResult | null;
  error: string | null;
  status: 'initial' | 'pending' | 'success' | 'error';
};
