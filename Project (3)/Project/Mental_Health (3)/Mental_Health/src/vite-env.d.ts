/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_API_URL: string;
  readonly NEXT_PUBLIC_FLASK_URL: string;
  readonly NEXT_PUBLIC_CLOUDINARY_URL: string;
  readonly NEXT_PUBLIC_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
