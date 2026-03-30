import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-white/5">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] border-b border-white/5">
        <span className="text-xs font-mono text-gray-400">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: '1rem',
          fontSize: '0.85rem',
          background: '#11111b',
        }}
        wrapLongLines
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="markdown-body prose prose-invert prose-sm max-w-none leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return <CodeBlock language={match[1]}>{children}</CodeBlock>;
            }
            if (!inline) {
              return <CodeBlock>{children}</CodeBlock>;
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-white/10 text-[#c9d1d9] font-mono text-[0.85em]"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Style tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="w-full text-sm border-collapse border border-white/10">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-white/10 px-3 py-2 bg-white/5 text-left font-medium text-gray-300">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-white/10 px-3 py-2 text-gray-400">
                {children}
              </td>
            );
          },
          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
              >
                {children}
              </a>
            );
          },
          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-violet-500/50 pl-4 my-3 text-gray-400 italic">
                {children}
              </blockquote>
            );
          },
          // Lists
          ul({ children }) {
            return <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>;
          },
          // Headings
          h1({ children }) {
            return <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold text-white mt-3 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-gray-200 mt-2 mb-1">{children}</h3>;
          },
          // Paragraphs
          p({ children }) {
            return <p className="my-2 text-gray-300 leading-relaxed">{children}</p>;
          },
          // Horizontal rule
          hr() {
            return <hr className="border-white/10 my-4" />;
          },
        }}
      />
    </div>
  );
};

export default MarkdownRenderer;
