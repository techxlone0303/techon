interface GameCardProps {
  name: string;
  image: string;
  category: string;
}

export function GameCard({ name, image, category }: GameCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-card border border-border card-glow cursor-pointer">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {category}
        </span>
        <h3 className="font-display text-lg lg:text-xl font-bold text-foreground mt-1 tracking-tight">
          {name}
        </h3>
      </div>
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-foreground/50 group-hover:bg-foreground animate-pulse-glow" />
    </div>
  );
}
