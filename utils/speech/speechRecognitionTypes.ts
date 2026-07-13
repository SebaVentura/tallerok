export type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'interrupted'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'busy'
  | 'client'
  | 'speech-timeout'
  | 'unknown';

export type SpeechRecognitionResultEvent = {
  isFinal: boolean;
  results: Array<{ transcript?: string }>;
};

export type SpeechRecognitionErrorEvent = {
  error: SpeechRecognitionErrorCode;
  message?: string;
};

export type SpeechRecognitionNativeModule = {
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
  }) => void;
  stop: () => void;
  abort: () => void;
  requestPermissionsAsync: () => Promise<{
    granted: boolean;
    canAskAgain?: boolean;
  }>;
  isRecognitionAvailable: () => boolean;
  getSupportedLocales: (options: {
    androidRecognitionServicePackage?: string;
  }) => Promise<{ locales: string[]; installedLocales?: string[] }>;
  addListener: (
    eventName: string,
    listener: (event: unknown) => void,
  ) => { remove: () => void };
};

export type LoadedSpeechRecognitionModule = {
  ExpoSpeechRecognitionModule: SpeechRecognitionNativeModule;
};
