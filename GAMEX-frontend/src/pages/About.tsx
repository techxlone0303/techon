import { Layout } from '@/components/layout/Layout';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Database, Brain, Cpu, Target, Users, Award, Globe } from 'lucide-react';

const timeline = [
  {
    version: 'v1',
    title: 'Data Ingestion',
    description: 'Real-time data collection from major esports APIs, match feeds, and tournament systems.',
    icon: Database,
    status: 'complete',
  },
  {
    version: 'v2',
    title: 'Intelligence Engine',
    description: 'Advanced machine learning models for player analysis, team composition, and strategic insights.',
    icon: Brain,
    status: 'active',
  },
  {
    version: 'v3',
    title: 'Predictive Systems',
    description: 'Next-generation prediction models with tournament simulation and roster optimization.',
    icon: Cpu,
    status: 'upcoming',
  },
];

const team = [
  {
    name: 'Dhanshree Katre',
    role: 'Founder & Lead AI Architect',
    bio: 'Creator and Architect of GAMEX. Designed the multi-layer esports AI coaching intelligence, local Ollama integration, and live stream tracking engines.',
  },
  {
    name: 'Esports Intelligence Core',
    role: 'Chief Analytics Officer',
    bio: 'Former esports analyst with 8 years in competitive gaming. Built analytics systems for Tier 1 organizations.',
  },
  {
    name: 'Machine Learning Lab',
    role: 'Head of Neural Models',
    bio: 'Specialized in Glicko/Elo rating algorithms, Monte Carlo strategy simulation, and player clutch modeling.',
  },
  {
    name: 'Broadcast Systems',
    role: 'Head of Live Stream Insights',
    bio: 'Real-time telemetry and audience sentiment velocity integration for tier-1 VCT broadcasts.',
  },
];

const stats = [
  { value: '50M+', label: 'Matches Analyzed' },
  { value: '500K+', label: 'Players Tracked' },
  { value: '100+', label: 'Tournaments Covered' },
  { value: '85%', label: 'Prediction Accuracy' },
];

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-width">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded border border-border text-muted-foreground text-xs font-medium uppercase tracking-widest mb-6">
              About GAMEX
            </span>
            <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Building the Intelligence Layer for{' '}
              <span className="gradient-text">Competitive Gaming</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground">
              We're not just delivering stats. We're building decision intelligence 
              that helps teams, analysts, and organizations win in competitive esports.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 lg:py-16">
        <div className="container-width">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-lg bg-card border border-border text-center hover:border-foreground/30 transition-all duration-300"
              >
                <div className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2 stat-number">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding bg-card/30">
        <div className="container-width">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <SectionHeader
                badge="Our Mission"
                title="Data-Driven Decisions for Esports Excellence"
                subtitle=""
                centered={false}
              />
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The esports industry generates massive amounts of data every day—match results, 
                  player stats, strategic patterns, economic trends. But most of it goes unused.
                </p>
                <p>
                  GAMEX exists to transform that raw data into actionable intelligence. 
                  We give teams the insights they need to scout better, draft smarter, and compete harder.
                </p>
                <p>
                  Our AI doesn't just analyze what happened—it predicts what will happen next, 
                  giving our clients a competitive edge that was previously impossible.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300">
                <Target className="w-8 h-8 text-foreground mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2 tracking-tight">Precision</h3>
                <p className="text-sm text-muted-foreground">Every insight backed by data</p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300">
                <Globe className="w-8 h-8 text-foreground mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2 tracking-tight">Global</h3>
                <p className="text-sm text-muted-foreground">Coverage across all regions</p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300">
                <Award className="w-8 h-8 text-foreground mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2 tracking-tight">Excellence</h3>
                <p className="text-sm text-muted-foreground">Built for winners</p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300">
                <Users className="w-8 h-8 text-foreground mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2 tracking-tight">Trusted</h3>
                <p className="text-sm text-muted-foreground">Used by top organizations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <div className="container-width">
          <SectionHeader
            badge="Product Evolution"
            title="Our Journey to Esports AGI"
            subtitle="Building the most comprehensive intelligence platform in competitive gaming."
          />

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {timeline.map((item) => (
              <div
                key={item.version}
                className={`relative p-6 lg:p-8 rounded-lg border ${
                  item.status === 'active'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
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
                <h3 className={`font-display text-xl font-bold mb-2 tracking-tight ${
                  item.status === 'active' ? 'text-background' : 'text-foreground'
                }`}>
                  {item.version}: {item.title}
                </h3>
                <p className={`text-sm ${
                  item.status === 'active' ? 'text-background/70' : 'text-muted-foreground'
                }`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-card/30">
        <div className="container-width">
          <SectionHeader
            badge="Leadership"
            title="Built by Industry Veterans"
            subtitle="Our team combines deep esports expertise with world-class technical skills."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border border-border card-glow"
              >
                <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center mb-4 bg-foreground/5">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {member.name ? member.name[0] : member.role[0]}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground text-lg mb-1 tracking-tight">
                  {member.name || member.role}
                </h3>
                <div className="text-xs uppercase tracking-wider text-muted-foreground/80 font-medium mb-2">
                  {member.role}
                </div>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
