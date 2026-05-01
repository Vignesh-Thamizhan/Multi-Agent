import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Code, FileCode, Terminal, ChevronRight, Copy, Check } from 'lucide-react';
import usePipelineStore from '../store/pipelineStore';
import { AGENTS, PIPELINE_STATUSES } from '../utils/agentConfig';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * CodeSpace Component
 * 
 * Displays extracted code blocks from the Ollama model's responses
 * at the end of a local pipeline run.
 */
const CodeSpace = () => {
  const agents = usePipelineStore((s) => s.agents);
  const pipelineStatus = usePipelineStore((s) => s.pipelineStatus);
  const pipelineMode = usePipelineStore((s) => s.pipelineMode);

  // Only show in local (Ollama) mode when the pipeline is complete
  const isVisible = pipelineMode === 'local' && pipelineStatus === PIPELINE_STATUSES.COMPLETE;

  const extractedBlocks = useMemo(() => {
    if (!isVisible) return [];

    const blocks = [];
    const agentsToScan = ['planner', 'coder', 'reviewer', 'debugger'];

    agentsToScan.forEach((agentId) => {
      const content = agents[agentId]?.content;
      if (!content) return;

      // Even more permissive regex to catch code blocks
      const blockRegex = /(?:(?:File|Path|Name|###|##|#):\s*[`*]*([a-zA-Z0-9._\-/]+)[`*]*\s*\n|(?:\*\*|__)([a-zA-Z0-9._\-/]+)(?:\*\*|__)\s*\n|([a-zA-Z0-9._\-/]+\.[a-z]+)\n)?```(?:(\w+)\n)?([\s\S]*?)```/g;
      
      let match;
      while ((match = blockRegex.exec(content)) !== null) {
        const filename = match[1] || match[2] || match[3] || null;
        const language = match[4] || 'text';
        const code = match[5].trim();
        
        if (code) {
          blocks.push({
            agentId,
            filename,
            language,
            code,
            id: `${agentId}-${blocks.length}-${Math.random().toString(36).substr(2, 9)}`
          });
        }
      }
    });

    return blocks;
  }, [agents, isVisible]);

  if (!isVisible) return null;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-8 mb-12 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Code size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Ollama Code Space</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Terminal size={12} />
              Generated code blocks from local model
            </p>
          </div>
        </div>
        {extractedBlocks.length > 0 && (
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            {extractedBlocks.length} {extractedBlocks.length === 1 ? 'Block' : 'Blocks'} Detected
          </div>
        )}
      </div>

      {/* Code Blocks List */}
      <div className="space-y-8">
        {extractedBlocks.length > 0 ? (
          extractedBlocks.map((block, idx) => (
            <Motion.div
              key={block.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: `${AGENTS[block.agentId]?.color}15`,
                      color: AGENTS[block.agentId]?.color
                    }}
                  >
                    <span className="opacity-70">{AGENTS[block.agentId]?.icon}</span>
                    {AGENTS[block.agentId]?.label}
                  </div>
                  
                  {block.filename ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
                      <ChevronRight size={14} className="text-gray-600" />
                      <FileCode size={14} className="text-blue-400" />
                      <span className="font-mono">{block.filename}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium italic">
                      <ChevronRight size={14} className="text-gray-600" />
                      <span>Unspecified file</span>
                    </div>
                  )}
                </div>
                
                <div className="text-[10px] font-mono text-gray-600 group-hover:text-gray-400 transition-colors">
                  {block.language}
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d0d16] shadow-2xl shadow-black/50">
                <MarkdownRenderer content={`\`\`\`${block.language}\n${block.code}\n\`\`\``} />
              </div>
            </Motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-500">
              <FileCode size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-300 mb-1">No explicit code blocks found</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              The model may have generated text without standard markdown code blocks. 
              Check the agent responses above for raw output.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
        <div className="mt-1 text-blue-400">
          <Check size={16} />
        </div>
        <div>
          <p className="text-xs text-blue-300/80 leading-relaxed">
            These codes were extracted directly from the model's text stream. 
            In local mode, the system prioritizes showing the raw output as local models may have varying tool support.
          </p>
        </div>
      </div>
    </Motion.div>
  );
};

export default CodeSpace;
