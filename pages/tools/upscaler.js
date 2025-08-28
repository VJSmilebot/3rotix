import dynamic from "next/dynamic";

// Dynamically import so it only runs client-side (avoids SSR issues)
const ImageUpscaler = dynamic(() => import("../../components/ImageUpscaler"), {
  ssr: false,
});

export default function UpscalerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">AI Image Upscaler</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Private, on-device 2×/4× upscaling using ESRGAN + TensorFlow.js.
        </p>
        <ImageUpscaler />
        <footer className="mt-12 text-center text-xs text-gray-500 dark:text-gray-400">
          Runs entirely in your browser. No server. No uploads.
        </footer>
      </div>
    </main>
  );
}
