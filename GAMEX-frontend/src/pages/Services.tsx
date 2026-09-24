import { Layout } from '@/components/layout/Layout';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { Link } from 'react-router-dom';
import {
  Target,
  Users,
  Trophy,
  FileText,
  Radio,
  Building,
  ArrowRight,
  Rocket,
  Brain,
  Zap,
} from 'lucide-react';

const services = [
  {
    icon: Target,
    title: 'Matchup Prediction Engine',
    description: 'AI-powered win probability analysis for upcoming matches. Our models consider player form, historical matchups, map pools, and meta dynamics.',
    status: 'live' as const,
  },
  {
    icon: Users,
    title: 'Player Performance Intelligence',
    description: 'Deep-dive analytics on individual player performance. Track improvement curves, identify strengths and weaknesses, and predict future potential.',
    status: 'live' as const,
  },
  {
    icon: Trophy,
    title: 'Tournament Analytics',
    description: 'Comprehensive tournament coverage with bracket predictions, upset alerts, and prize pool optimization strategies for organizers.',
    status: 'live' as const,
  },
  {
    icon: FileText,
    title: 'AI-Generated Scouting Reports',
    description: 'Automated scouting reports that analyze opponents, suggest counter-strategies, and identify key players to watch.',
    status: 'coming-soon' as const,
  },
  {
    icon: Radio,
    title: 'Live Match Intelligence',
    description: 'Real-time insights during live matches. Win probability shifts, momentum analysis, and strategic recommendations as the game unfolds.',
    status: 'coming-soon' as const,
  },
  {
    icon: Building,
    title: 'Custom Enterprise Intelligence',
    description: 'Tailored AI solutions for organizations. Custom data pipelines, proprietary models, and dedicated analyst support.',
    status: 'live' as const,
  },
];

const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Core Intelligence',
    description: 'Foundation layer with match data ingestion, player tracking, and basic predictive models across major titles.',
    icon: Rocket,
    items: ['Match Prediction API', 'Player Database', 'Historical Analytics', 'Basic Scouting'],
    status: 'complete' as const,
  },
  {
    phase: 'Phase 2',
    title: 'Team & Player AI Models',
    description: 'Advanced machine learning models for team composition optimization, player value assessment, and trade analysis.',
    icon: Brain,
    items: ['Roster Optimization', 'Transfer Value AI', 'Team Chemistry Models', 'Draft Assistance'],
    status: 'active' as const,
  },
  {
    phase: 'Phase 3',
    title: 'Esports AGI Platform',
    description: 'The ultimate esports intelligence system. Fully autonomous scouting, strategy generation, and predictive analytics at scale.',
    icon: Zap,
    items: ['Autonomous Scouting', 'Strategy Generation', 'Real-time Coaching AI', 'Market Intelligence'],
    status: 'upcoming' as const,
  },
];

export default function Services() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-width">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded border border-border text-muted-foreground text-xs font-medium uppercase tracking-widest mb-6">
              Our Platform
            </span>
            <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 tracking-tight">
              AI Intelligence for{' '}
              <span className="gradient-text">Every Esports Need</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground">
              From match predictions to enterprise solutions, GAMEX delivers 
              the insights you need to compete at the highest level.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding">
        <div className="container-width">
          <SectionHeader
            badge="Services"
            title="Intelligence Products"
            subtitle="Comprehensive analytics and AI-powered tools for competitive esports."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={service.title}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="section-padding bg-card/30">
        <div className="container-width">
          <SectionHeader
            badge="Roadmap"
            title="Building Towards Esports AGI"
            subtitle="Our vision for the future of competitive gaming intelligence."
          />

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {roadmap.map((item) => (
              <div
                key={item.phase}
                className={`relative p-6 lg:p-8 rounded-lg border ${
                  item.status === 'active'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-lg border flex items-center justify-center ${
                      item.status === 'active'
                        ? 'border-background/30'
                        : 'border-border'
                    }`}
                  >
                    <item.icon
                      className={`w-6 h-6 ${
                        item.status === 'active'
                          ? 'text-background'
                          : item.status === 'complete'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <span
                    className={`px-3 py-1 rounded border text-xs font-medium uppercase tracking-wider ${
                      item.status === 'active'
                        ? 'border-background/30 text-background'
                        : item.status === 'complete'
                        ? 'border-foreground text-foreground'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {item.status === 'complete' ? 'Complete' : item.status === 'active' ? 'In Progress' : 'Upcoming'}
                  </span>
                </div>

                <span className={`text-xs font-semibold uppercase tracking-widest ${
                  item.status === 'active' ? 'text-background/70' : 'text-muted-foreground'
                }`}>
                  {item.phase}
                </span>
                <h3 className={`font-display text-xl font-bold mt-1 mb-3 tracking-tight ${
                  item.status === 'active' ? 'text-background' : 'text-foreground'
                }`}>
                  {item.title}
                </h3>
                <p className={`text-sm mb-4 ${
                  item.status === 'active' ? 'text-background/70' : 'text-muted-foreground'
                }`}>
                  {item.description}
                </p>

                <ul className="space-y-2">
                  {item.items.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'active'
                            ? 'bg-background'
                            : item.status === 'complete'
                            ? 'bg-foreground'
                            : 'bg-muted-foreground'
                        }`}
                      />
                      <span className={item.status === 'active' ? 'text-background/80' : 'text-muted-foreground'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-width">
          <div className="relative overflow-hidden rounded-lg bg-card border border-border p-8 lg:p-16 text-center">
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Ready to Transform Your Esports Operations?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Get a personalized demo of our platform and see how GAMEX can give your team the edge.
              </p>
              <Link to="/contact" className="btn-primary inline-flex items-center gap-2 uppercase tracking-wider">
                Schedule a Demo
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
