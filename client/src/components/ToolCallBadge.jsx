const ToolCallBadge = ({ tool, agent }) => {
  if (!tool) return null;
  return (
    <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-300">
      {agent}: {tool}
    </span>
  );
};

export default ToolCallBadge;
