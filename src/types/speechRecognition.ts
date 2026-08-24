export interface SpeechRecognitionEvent
  extends Event {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent
  extends Event {
  error: string;
}

export interface SpeechRecognitionInstance
  extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start: () => void;
  stop: () => void;
  abort: () => void;

  onstart:
    | (() => void)
    | null;

  onend:
    | (() => void)
    | null;

  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null;

  onerror:
    | ((event: SpeechRecognitionErrorEvent) => void)
    | null;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}