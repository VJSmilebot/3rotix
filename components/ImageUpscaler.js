// components/ImageUpscaler.js
import { useState, useRef, useEffect } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

export default function ImageUpscaler() {
  const [original, setOriginal] = useState(null);
  const [upscaled, setUpscaled] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(2);
  const [model, setModel] = useState("RealESRGAN_x4plus");
  const [faceEnhance, setFaceEnhance] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [fileBase64, setFileBase64] = useState(""); // hold until upscale
  const fileInputRef = useRef(null);

  // Fake smooth progress bar
  useEffect(() => {
    let interval;
    if (loading) {
      setProgress(10); // start at 10%
      interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev)); // creep to 90%
      }, 800);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFile = (file) => {
    if (!file) return;
    setUpscaled(null);
    setError("");
    setRotation(0);

    const previewURL = URL.createObjectURL(file);
    setOriginal(previewURL);

    const reader = new FileReader();
    reader.onloadend = () => setFileBase64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const runUpscale = async () => {
    if (!fileBase64) {
      setError("No image uploaded.");
      return;
    }
    setLoading(true);
    setError("");
    setUpscaled(null);

    try {
      const resp = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: fileBase64, model, scale, faceEnhance }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upscale failed");

      setUpscaled(data.url);
      setProgress(100); // jump to 100% when done
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = async () => {
    if (!upscaled) return;
    const response = await fetch(upscaled);
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "upscaled.png";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReset = () => {
    setOriginal(null);
    setUpscaled(null);
    setFileBase64("");
    setError("");
    setRotation(0);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-2xl text-white">
      <h2 className="text-3xl font-extrabold mb-6 text-center">✨ AI Image Upscaler</h2>
      <p className="text-center text-gray-400 mb-8">
        Upload an image, then click Upscale to enhance it (2× / 4×, optional face fix).
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow"
        >
          <option value="RealESRGAN_x2plus">RealESRGAN_x2plus</option>
          <option value="RealESRGAN_x4plus">RealESRGAN_x4plus</option>
          <option value="RealESRNet_x4plus">RealESRNet_x4plus</option>
          <option value="RealESRGAN_x4plus_anime_6B">RealESRGAN_x4plus_anime_6B</option>
        </select>

        <select
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow"
        >
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={faceEnhance}
            onChange={(e) => setFaceEnhance(e.target.checked)}
            className="w-4 h-4"
          />
          Face Enhance
        </label>
      </div>

      {/* Drag & Drop Upload */}
      {!original && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-500 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-gray-300">Click to upload or drag & drop</p>
          <p className="text-gray-500 text-sm">PNG / JPG / WebP • up to 20 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </div>
      )}

      {error && <p className="text-red-400 text-center mt-4">{error}</p>}

      {/* Loading + Progress Bar */}
      {loading && (
        <div className="mt-6 text-center">
          <p className="text-blue-400 text-sm mb-2">⏳ Upscaling... {progress}%</p>
          <div className="w-2/3 mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {original && !upscaled && !loading && (
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Preview</p>
          <img
            src={original}
            alt="Preview"
            className="mx-auto max-h-[50vh] rounded-lg shadow-md"
            style={{ transform: `rotate(${rotation}deg)` }}
          />

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={runUpscale}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow text-white"
            >
              🚀 Upscale
            </button>
            <button
              onClick={handleRotate}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg shadow text-white"
            >
              🔄 Rotate
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow text-white"
            >
              ♻ Reset
            </button>
          </div>
        </div>
      )}

      {/* Compare Slider once ready */}
      {original && upscaled && !loading && (
        <div className="mt-8">
          <div className="relative" style={{ transform: `rotate(${rotation}deg)` }}>
            <ReactCompareSlider
              className="rounded-lg shadow-lg"
              itemOne={<ReactCompareSliderImage src={original} alt="Original" />}
              itemTwo={<ReactCompareSliderImage src={upscaled} alt="Upscaled" />}
            />
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow text-white"
            >
              ⬇ Download
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow text-white"
            >
              ♻ Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
