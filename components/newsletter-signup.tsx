'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NewsletterSignup() {
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
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 text-primary">
        <CheckCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Subscribe to our newsletter</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Get the latest paranormal investigations and ghost stories delivered to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2" data-testid="newsletter-form">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={status === 'loading'}
          data-testid="newsletter-email-input"
        />
        <Button 
          type="submit" 
          disabled={status === 'loading'}
          data-testid="newsletter-submit"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
      {status === 'error' && (
        <p className="text-sm text-destructive">{message}</p>
      )}
    </div>
  );
}
