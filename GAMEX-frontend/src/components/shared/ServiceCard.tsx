import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'live' | 'coming-soon';
}

export function ServiceCard({ icon: Icon, title, description, status }: ServiceCardProps) {
  return (
    <div className="group p-6 lg:p-8 rounded-lg bg-card border border-border card-glow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center group-hover:border-foreground transition-colors">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <span
          className={`px-3 py-1 rounded border text-xs font-medium uppercase tracking-wider ${
            status === 'live'
              ? 'border-foreground text-foreground'
              : 'border-border text-muted-foreground'
          }`}
        >
          {status === 'live' ? 'Live' : 'Coming Soon'}
        </span>
      </div>
      <h3 className="font-display text-lg lg:text-xl font-bold text-foreground mb-2 group-hover:text-foreground transition-colors tracking-tight">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
