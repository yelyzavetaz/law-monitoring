export function renderUnifiedDiff(patch: string) {
  const lines = patch.split(/\r?\n/);
  return lines.map((ln, i) => {
    let cls = "";
    if (ln.startsWith("+++") || ln.startsWith("---") || ln.startsWith("@@"))
      cls = "text-cyan-400";
    else if (ln.startsWith("+")) cls = "text-emerald-400";
    else if (ln.startsWith("-")) cls = "text-rose-400";
    else cls = "text-zinc-200";
    return (
      <div key={i} className={cls}>
        {ln}
      </div>
    );
  });
}
