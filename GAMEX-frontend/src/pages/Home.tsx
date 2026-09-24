import { Link } from 'react-router-dom';
import { ArrowRight, Target, Brain, TrendingUp, Shield, Users, Zap } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { GameCard } from '@/components/shared/GameCard';
import { FeatureWidget } from '@/components/shared/FeatureWidget';

import heroBackground from '@/assets/hero-bg.jpg';
import valorantImage from '@/assets/game-valorant.jpg';
import fortniteImage from '@/assets/game-fortnite.jpg';
import rocketLeagueImage from '@/assets/game-rocketleague.jpg';
import cs2Image from '@/assets/game-cs2.jpg';
import lolImage from '@/assets/game-lol.jpg';

const games = [
  { name: 'Valorant', image: valorantImage, category: 'Tactical Shooter' },
  { name: 'Fortnite', image: fortniteImage, category: 'Battle Royale' },
  { name: 'Rocket League', image: rocketLeagueImage, category: 'Sports' },
  { name: 'CS2', image: cs2Image, category: 'Tactical Shooter' },
  { name: 'League of Legends', image: lolImage, category: 'MOBA' },
];

const features = [
  { icon: Target, title: 'Precision Scouting', description: 'AI-driven player analysis and talent identification' },
  { icon: Brain, title: 'Predictive Models', description: 'Machine learning match outcome predictions' },
  { icon: TrendingUp, title: 'Performance Trends', description: 'Historical data analysis and insights' },
  { icon: Shield, title: 'Team Intelligence', description: 'Strategic composition recommendations' },
];

const trustItems = [
  { icon: Users, label: 'Pro Teams' },
  { icon: Target, label: 'Analysts' },
  { icon: TrendingUp, label: 'Organizers' },
  { icon: Zap, label: 'Investors' },
];

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBackground}
            alt=""
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        {/* Grid Pattern Overlay - sits above canvas (z-1) */}
        <div className="absolute inset-0 grid-pattern opacity-40 z-[1]" />

        <div className="container-width relative z-10">
        <div className="container-width relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-border mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Now supporting 5 major esports titles</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 animate-fade-up tracking-tight" style={{ animationDelay: '0.1s' }}>
              AI-POWERED{' '}
              <span className="gradient-text">ESPORTS INTELLIGENCE</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Scouting, prediction, and performance analytics for competitive esports. 
              Make data-driven decisions that win championships.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/coach" className="btn-primary inline-flex items-center justify-center gap-2 uppercase tracking-wider">
                Launch AI Coach Hub
                <ArrowRight size={18} />
              </Link>
              <Link to="/services" className="btn-secondary inline-flex items-center justify-center gap-2 uppercase tracking-wider">
                View Platform
              </Link>
              <Link to="/contact" className="btn-secondary inline-flex items-center justify-center gap-2 uppercase tracking-wider">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border border-border flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-foreground/50" />
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="section-padding bg-card/30">
        <div className="container-width">
          <SectionHeader
            badge="Games We Cover"
            title="Intelligence Across Major Esports Titles"
            subtitle="Deep analytics and AI-powered insights for the most competitive games in the world."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
            {games.map((game, index) => (
              <div
                key={game.name}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GameCard {...game} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding">
        <div className="container-width">
          <SectionHeader
            badge="Platform Features"
            title="Intelligence That Drives Wins"
            subtitle="Our AI models process millions of data points to deliver actionable insights."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <FeatureWidget {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-padding bg-card/30">
        <div className="container-width">
          <div className="text-center mb-12">
            <p className="text-muted-foreground text-lg">
              Built for teams, analysts, organizers, and investors
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300"
              >
                <item.icon className="w-8 h-8 text-foreground" />
                <span className="font-medium text-foreground text-sm uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/about" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm uppercase tracking-wider">
              Learn more about GAMEX
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-width">
          <div className="relative overflow-hidden rounded-lg bg-card border border-border p-8 lg:p-16 text-center">
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Ready to Gain the Competitive Edge?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join the leading esports organizations already using GAMEX to make smarter decisions.
              </p>
              <Link to="/contact" className="btn-primary inline-flex items-center gap-2 uppercase tracking-wider">
                Get Started Today
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
