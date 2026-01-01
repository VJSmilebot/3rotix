export default function MediaPreview({ files, onRemove }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-800/50 rounded-lg">
      {files.map((file, index) => (
        <div key={index} className="relative group">
          {file.type.startsWith('image/') ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : file.type.startsWith('video/') ? (
            <video
              src={URL.createObjectURL(file)}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
              📄
            </div>
          )}
          
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-all"
          >
            ×
          </button>

          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-1 rounded-b-lg truncate">
            {file.name}
          </div>
        </div>
      ))}
    </div>
  );
}