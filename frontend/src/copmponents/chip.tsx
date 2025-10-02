export const Chip: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
}> = ({ children, className, title }) => (
  <span
    title={title}
    className={[
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {children}
  </span>
);
