/// <reference types="expo/types" />
/// <reference types="react-native/src/types/globals" />

// Variáveis EXPO_PUBLIC_* (ver .env.example).
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_API_URL?: string;
  }
}
