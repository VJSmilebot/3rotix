import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ProfileImageCropper({ imageUrl, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleCropComplete = (crop, percentCrop) => {
    setCompletedCrop(percentCrop);
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;

    // Create a canvas to draw the cropped image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    // Set canvas dimensions to the desired output size
    canvas.width = 400; // You can adjust this size
    canvas.height = 400;

    // Calculate source position and size
    const sourceX = (completedCrop.x / 100) * imgRef.current.width * scaleX;
    const sourceY = (completedCrop.y / 100) * imgRef.current.height * scaleY;
    const sourceWidth = (completedCrop.width / 100) * imgRef.current.width * scaleX;
    const sourceHeight = (completedCrop.height / 100) * imgRef.current.height * scaleY;

    // Apply rotation if any
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-canvas.width/2, -canvas.height/2);
    
    // Draw the image on the canvas
    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    ctx.restore();
    
    // Convert canvas to blob and pass back to parent
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        onCropComplete(blob);
      },
      'image/jpeg',
      0.95 // quality
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
        <h3 className="text-xl font-bold mb-4 text-white">Adjust Profile Image</h3>
        
        <div className="mb-4 flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={handleCropComplete}
            aspect={1}
            circularCrop
            className="max-h-96"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Profile"
              onLoad={onImageLoad}
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
            />
          </ReactCrop>
        </div>
        
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Zoom</label>
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1" 
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rotate</label>
            <input 
              type="range" 
              min="-180" 
              max="180" 
              value={rotate} 
              onChange={(e) => setRotate(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 rounded text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}