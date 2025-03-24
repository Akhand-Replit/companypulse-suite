
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import PageLayout from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Demo',
    price: 'Free',
    description: 'Try our platform with limited features',
    features: [
      '1 company',
      '1 branch',
      '5 employees',
      'Limited reports',
      '1 month access',
      'Email support',
    ],
    cta: 'Start Free Demo',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$25',
    description: 'Perfect for small to medium businesses',
    features: [
      '1 company',
      '3 branches',
      '10 employees per branch',
      'Full reporting suite',
      'Job board access',
      'Priority email support',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Custom',
    price: '$50+',
    description: 'Tailored solutions for larger organizations',
    features: [
      'Multiple companies',
      'Unlimited branches',
      'Unlimited employees',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
    ],
    cta: 'Contact Us',
    popular: false,
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Simple, transparent pricing"
            subtitle="Choose the plan that works best for your business needs."
            centered
            className="mb-16"
          />

          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center p-1 bg-muted rounded-full page-transition-element">
              <button
                className={cn(
                  "px-4 py-2 text-sm rounded-full transition-colors focus:outline-none",
                  billingCycle === "monthly" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground"
                )}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={cn(
                  "px-4 py-2 text-sm rounded-full transition-colors focus:outline-none",
                  billingCycle === "yearly" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground"
                )}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly <span className="text-primary">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={plan.name}
                className={cn(
                  "relative rounded-2xl bg-background border p-8",
                  "transition-all duration-300 page-transition-element",
                  plan.popular 
                    ? "border-primary shadow-elevated scale-105 md:scale-110 z-10 delay-100" 
                    : "border-border shadow-subtle hover:border-primary/50 hover:shadow-md",
                  `delay-${index * 100}`
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="inline-block bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-medium mb-2">{plan.name}</h3>
                  <div className="flex justify-center items-baseline mb-2">
                    <span className="text-4xl font-display font-medium">
                      {billingCycle === 'yearly' && plan.price !== 'Free' 
                        ? `$${parseInt(plan.price.replace('$', '')) * 0.8}` 
                        : plan.price}
                    </span>
                    {plan.price !== 'Free' && (
                      <span className="text-muted-foreground ml-1">/mo</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <Link to={plan.name === 'Custom' ? "/contact" : "/register"}>
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <SectionHeading
              title="Frequently Asked Questions"
              centered
              className="mb-12"
            />

            <div className="space-y-8 text-left">
              <div className="bg-background rounded-xl p-6 shadow-subtle page-transition-element">
                <h3 className="text-lg font-medium mb-2">Can I change my plan later?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </div>
              
              <div className="bg-background rounded-xl p-6 shadow-subtle page-transition-element delay-100">
                <h3 className="text-lg font-medium mb-2">How does the free demo work?</h3>
                <p className="text-muted-foreground">
                  The free demo gives you access to a limited version of our platform for one month, allowing you to explore the core features before committing to a paid plan.
                </p>
              </div>
              
              <div className="bg-background rounded-xl p-6 shadow-subtle page-transition-element delay-200">
                <h3 className="text-lg font-medium mb-2">Is there a contract or commitment?</h3>
                <p className="text-muted-foreground">
                  No long-term contracts or commitments. Our paid plans are billed monthly or annually, and you can cancel at any time.
                </p>
              </div>
              
              <div className="bg-background rounded-xl p-6 shadow-subtle page-transition-element delay-300">
                <h3 className="text-lg font-medium mb-2">What kind of support is included?</h3>
                <p className="text-muted-foreground">
                  All plans include email support. Pro plans and above include priority support with faster response times. Custom plans can include dedicated support options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
