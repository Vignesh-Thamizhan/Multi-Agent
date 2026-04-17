import useWorkspaceStore from '../store/workspaceStore';
import MarkdownRenderer from './MarkdownRenderer';

const FileExplorer = ({ sessionId }) => {
  const files = useWorkspaceStore((s) => s.files);
  const selectedFile = useWorkspaceStore((s) => s.selectedFile);
  const selectedContent = useWorkspaceStore((s) => s.selectedContent);
  const openFile = useWorkspaceStore((s) => s.openFile);

  const downloadZip = () => {
    if (!sessionId) return;
    window.open(`/api/workspace/${sessionId}/download`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3">
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-gray-400">Workspace</p>
          <button onClick={downloadZip} className="text-xs text-cyan-300 hover:text-cyan-200">
            Download zip
          </button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => openFile(sessionId, file.path)}
              className={`w-full text-left rounded px-2 py-1 text-xs ${
                selectedFile === file.path ? 'bg-cyan-500/20 text-cyan-200' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              {file.path}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">{selectedFile || 'Select a file'}</p>
        <MarkdownRenderer content={`\`\`\`\n${selectedContent || ''}\n\`\`\``} />
      </div>
    </div>
  );
};

export default FileExplorer;
