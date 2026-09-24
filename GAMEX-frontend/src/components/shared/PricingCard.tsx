import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  cta,
}: PricingCardProps) {
  return (
    <div
      className={`relative p-6 lg:p-8 rounded-lg border ${
        highlighted
          ? 'bg-foreground text-background border-foreground'
          : 'bg-card border-border'
      } card-glow`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded bg-background text-foreground text-xs font-semibold uppercase tracking-wider border border-foreground">
          Most Popular
        </span>
      )}
      
      <div className="mb-6">
        <h3 className={`font-display text-xl font-bold mb-2 tracking-tight ${highlighted ? 'text-background' : 'text-foreground'}`}>
          {name}
        </h3>
        <p className={`text-sm ${highlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
          {description}
        </p>
      </div>

      <div className="mb-6">
        <span className={`font-display text-4xl lg:text-5xl font-bold stat-number ${highlighted ? 'text-background' : 'text-foreground'}`}>
          {price}
        </span>
        <span className={`ml-2 ${highlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
          {period}
        </span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlighted ? 'text-background' : 'text-foreground'}`} />
            <span className={`text-sm ${highlighted ? 'text-background/80' : 'text-muted-foreground'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        to="/contact"
        className={`block w-full text-center py-3 rounded-md font-semibold transition-all border uppercase tracking-wider text-sm ${
          highlighted
            ? 'bg-background text-foreground border-background hover:bg-transparent hover:text-background hover:border-background'
            : 'bg-transparent text-foreground border-foreground hover:bg-foreground hover:text-background'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
