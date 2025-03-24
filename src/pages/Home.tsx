
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Users, Briefcase, Clock, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { FeatureCard } from '@/components/ui/feature-card';
import PageLayout from '@/components/layout/PageLayout';

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium tracking-tight mb-6 page-transition-element">
              Streamline your company management
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed page-transition-element delay-100">
              A comprehensive platform for managing your organization, tracking employee activities, and finding top talent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center page-transition-element delay-200">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/jobs">Find Jobs</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden -z-10 opacity-30">
          <div className="absolute -top-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[20%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Everything you need to manage your business"
            subtitle="Our platform offers a complete suite of tools to help you run your company efficiently."
            centered
            className="mb-16"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Employee Management"
              description="Create employee accounts, assign roles, and manage permissions across your organization."
              className="delay-100"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Comprehensive Reports"
              description="Generate detailed reports on branch performance, employee productivity, and more."
              className="delay-200"
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Task Assignment"
              description="Create, assign, and track tasks for branches or specific employees."
              className="delay-300"
            />
            <FeatureCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Job Board Integration"
              description="Post jobs directly from your dashboard and review applications."
              className="delay-400"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Role-Based Access"
              description="Ensure security with differentiated access for admins, managers, and employees."
              className="delay-500"
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Branch Management"
              description="Easily create and manage all your company branches in one place."
              className="delay-600"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <SectionHeading
              title="Ready to transform your business management?"
              subtitle="Choose a plan that works for your organization and get started today."
              centered
              className="mb-10"
            />
            <div className="flex flex-col sm:flex-row gap-4 justify-center page-transition-element">
              <Button size="lg" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-[10%] -left-[15%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[10%] -right-[15%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl" />
        </div>
      </section>

      {/* Testimonials or additional sections can be added here */}
    </PageLayout>
  );
}
