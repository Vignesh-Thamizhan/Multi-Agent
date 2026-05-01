import { useState, useRef, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { Send, Paperclip, X, FileText, Image, Code, Loader2, Square } from 'lucide-react';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, getAllAcceptedExtensions } from '../utils/agentConfig';

const getFileIcon = (filename) => {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  if (ACCEPTED_FILE_TYPES.images.includes(ext)) return <Image size={14} className="text-emerald-400" />;
  if (ACCEPTED_FILE_TYPES.code.includes(ext)) return <Code size={14} className="text-cyan-400" />;
  return <FileText size={14} className="text-violet-400" />;
};

const PromptInput = ({ onSubmit, onFileUpload, isLoading, onStop }) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      if (isLoading) return;

      if (file) {
        onFileUpload(prompt.trim() || 'Analyze this file and provide insights.', file);
        setFile(null);
        setPrompt('');
        return;
      }

      if (!prompt.trim()) return;
      onSubmit(prompt.trim());
      setPrompt('');
    },
    [prompt, file, isLoading, onSubmit, onFileUpload]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    validateAndSetFile(selected);
    e.target.value = '';
  };

  const validateAndSetFile = (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!getAllAcceptedExtensions().includes(ext)) {
      alert(`Unsupported file type: ${ext}`);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      alert('File exceeds 10 MB limit');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border transition-all duration-300 ${
          dragOver
            ? 'border-violet-500 bg-violet-500/5 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
        }`}
      >
        {/* File preview */}
        {file && (
          <div className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            {getFileIcon(file.name)}
            <span className="text-xs text-gray-300 truncate flex-1">{file.name}</span>
            <span className="text-[10px] text-gray-500 font-mono">
              {(file.size / 1024).toFixed(1)}KB
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          {/* File attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-white/5 transition-all cursor-pointer"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={getAllAcceptedExtensions().join(',')}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={file ? 'Add instructions for the file...' : 'Describe what you want to build...'}
            rows={1}
            className="flex-1 bg-transparent text-gray-200 text-sm placeholder:text-gray-600 resize-none outline-none min-h-[24px] max-h-[200px] py-1"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
            }}
            disabled={isLoading}
            id="prompt-input"
          />

          {/* Submit/Stop button */}
          <div className="flex items-center gap-2">
            {isLoading && (
              <Motion.button
                type="button"
                onClick={onStop}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/20 cursor-pointer"
                title="Stop conversation"
              >
                <Square size={18} fill="currentColor" />
              </Motion.button>
            )}

            <Motion.button
              type="submit"
              disabled={isLoading || (!prompt.trim() && !file)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 p-2 rounded-xl transition-all cursor-pointer ${
                isLoading || (!prompt.trim() && !file)
                  ? 'bg-white/5 text-gray-600'
                  : 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20'
              }`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Motion.button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;
