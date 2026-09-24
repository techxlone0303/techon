interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({ badge, title, subtitle, centered = true }: SectionHeaderProps) {
  return (
    <div className={`mb-12 lg:mb-16 ${centered ? 'text-center' : ''}`}>
      {badge && (
        <span className="inline-block px-4 py-1.5 rounded border border-border text-muted-foreground text-xs font-medium uppercase tracking-widest mb-4">
          {badge}
        </span>
      )}
      <h2 className="font-display text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-4 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className={`text-muted-foreground text-lg lg:text-xl ${centered ? 'max-w-2xl mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
