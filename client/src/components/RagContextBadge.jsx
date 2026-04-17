const RagContextBadge = ({ count = 0 }) => (
  <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
    RAG Context: {count}
  </span>
);

export default RagContextBadge;
