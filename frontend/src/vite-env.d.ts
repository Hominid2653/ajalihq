/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GEOCODE_API_BASE?: string
  readonly VITE_WEATHER_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}