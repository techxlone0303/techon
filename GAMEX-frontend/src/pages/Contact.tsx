import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Mail, MapPin, Phone, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-width">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded border border-border text-muted-foreground text-xs font-medium uppercase tracking-widest mb-6">
              Contact Us
            </span>
            <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Let's Build Your{' '}
              <span className="gradient-text">Competitive Edge</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground">
              Ready to transform your esports operations? Our team is here to help
              you find the right solution.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="section-padding">
        <div className="container-width">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6 tracking-tight">
                Get in Touch
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether you're a professional team, tournament organizer, or esports investor,
                we'd love to hear from you. Our team typically responds within 24 hours.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1 tracking-tight">Email</h3>
                    <p className="text-muted-foreground text-sm">hello@gamex.ai</p>
                    <p className="text-muted-foreground text-sm">sales@gamex.ai</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1 tracking-tight">Location</h3>
                    <p className="text-muted-foreground text-sm">Remote-first company</p>
                    <p className="text-muted-foreground text-sm">Headquarters in San Francisco, CA</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-foreground/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1 tracking-tight">Schedule a Call</h3>
                    <p className="text-muted-foreground text-sm">Book a demo with our team</p>
                    <p className="text-muted-foreground text-sm">Available Mon-Fri, 9AM-6PM PST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-6 lg:p-8 rounded-lg bg-card border border-border">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-lg border border-foreground flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2 tracking-tight">
                    Message Sent!
                  </h3>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-all"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium text-foreground mb-2 uppercase tracking-wider">
                      Organization
                    </label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-all"
                      placeholder="Your team or company"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2 uppercase tracking-wider">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-all resize-none"
                      placeholder="Tell us about your needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    Send Message
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
