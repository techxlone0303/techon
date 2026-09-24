import { LucideIcon } from 'lucide-react';

interface FeatureWidgetProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureWidget({ icon: Icon, title, description }: FeatureWidgetProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300 group">
      <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center flex-shrink-0 group-hover:border-foreground transition-colors">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h4 className="font-display font-semibold text-foreground mb-1 tracking-tight">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
