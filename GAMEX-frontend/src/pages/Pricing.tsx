import { Layout } from '@/components/layout/Layout';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { PricingCard } from '@/components/shared/PricingCard';
import { Link } from 'react-router-dom';
import { ArrowRight, HelpCircle } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Starter',
    price: '$500',
    period: '/ month',
    description: 'Basic stats and reports for analysts and content creators.',
    features: [
      'Match prediction API access',
      'Player statistics dashboard',
      'Historical data (last 6 months)',
      'Basic scouting reports',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$2,000',
    period: '/ month',
    description: 'Advanced AI scouting for serious teams and organizations.',
    features: [
      'Everything in Starter',
      'Advanced AI scouting models',
      'Player potential projections',
      'Team composition analysis',
      'Real-time match intelligence',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$5,000',
    period: '/ month',
    description: 'Full intelligence suite for professional esports teams.',
    features: [
      'Everything in Professional',
      'Custom player tracking lists',
      'Opponent preparation tools',
      'Draft and roster optimization',
      'Tournament simulation',
      'Dedicated analyst support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: '$10,000+',
    period: '/ event',
    description: 'Custom AI solutions for tournaments and leagues.',
    features: [
      'Everything in Team',
      'Custom data pipelines',
      'Proprietary AI models',
      'White-label solutions',
      'On-site consulting',
      'SLA guarantees',
    ],
    cta: 'Talk to Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Which games do you support?',
    answer: 'We currently support Valorant, CS2, League of Legends, Fortnite, and Rocket League. More titles are being added based on customer demand.',
  },
  {
    question: 'Can I switch plans at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, we offer a 20% discount for annual subscriptions. Contact our sales team for details.',
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'All plans include email support. Professional and above get priority support with faster response times. Enterprise clients get dedicated analyst support.',
  },
];

export default function Pricing() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-width">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded border border-border text-muted-foreground text-xs font-medium uppercase tracking-widest mb-6">
              Pricing
            </span>
            <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Intelligence That{' '}
              <span className="gradient-text">Scales With You</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground">
              From individual analysts to major tournaments, we have a plan 
              that fits your needs and budget.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="section-padding">
        <div className="container-width">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <PricingCard {...plan} />
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Pricing varies by game, region, and event scale. Contact us for custom quotes.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-card/30">
        <div className="container-width">
          <SectionHeader
            badge="FAQ"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about our pricing and plans."
          />

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300"
              >
                <div className="flex items-start gap-3 mb-3">
                  <HelpCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                  <h3 className="font-display font-semibold text-foreground tracking-tight">
                    {faq.question}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground ml-8">{faq.answer}</p>
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
                Need a Custom Solution?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Our enterprise team can build custom intelligence solutions tailored to your specific needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="btn-primary inline-flex items-center justify-center gap-2 uppercase tracking-wider">
                  Talk to Sales
                  <ArrowRight size={18} />
                </Link>
                <Link to="/contact" className="btn-secondary inline-flex items-center justify-center gap-2 uppercase tracking-wider">
                  Request Custom Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
