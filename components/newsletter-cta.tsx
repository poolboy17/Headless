'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Loader2, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    // Simulate API call - in production, this would connect to a newsletter service
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStatus('success');
    setMessage('Thanks for subscribing! Check your inbox to confirm.');
    setEmail('');
  };

  if (status === 'success') {
    return (
      <section className="my-12 md:my-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">{message}</h3>
            <p className="text-muted-foreground">We&apos;ll send you the best paranormal content.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="my-12 md:my-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10">
          <Ghost className="h-64 w-64 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              <Mail className="h-4 w-4" />
              Newsletter
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Stay Updated on the Supernatural
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto lg:mx-0">
              Join thousands of paranormal enthusiasts. Get exclusive ghost stories,
              investigation tips, and haunted location guides delivered weekly.
            </p>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[320px]">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 bg-white dark:bg-neutral-900 border-primary/20"
                disabled={status === 'loading'}
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 px-8 whitespace-nowrap"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Subscribe Free'
                )}
              </Button>
            </form>
            {status === 'error' && (
              <p className="text-sm text-destructive mt-2">{message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center lg:text-left">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
