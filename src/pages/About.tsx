
import PageLayout from '@/components/layout/PageLayout';
import { SectionHeading } from '@/components/ui/section-heading';

export default function About() {
  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="About CompanyPulse"
            subtitle="Our mission is to simplify company management and help businesses thrive."
            className="mb-16"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-6 page-transition-element">
              <h3 className="text-2xl font-medium">Our Story</h3>
              <p className="text-muted-foreground">
                CompanyPulse was founded with a simple vision: to create a platform that makes company management accessible, efficient, and intuitive for businesses of all sizes.
              </p>
              <p className="text-muted-foreground">
                What started as a solution for small businesses has grown into a comprehensive platform serving organizations across various industries, helping them streamline operations, manage employees effectively, and find top talent.
              </p>
              <p className="text-muted-foreground">
                Our approach combines powerful management tools with an elegant, user-friendly interface that prioritizes simplicity and productivity.
              </p>
            </div>
            
            <div className="relative h-80 md:h-full rounded-2xl overflow-hidden page-transition-element delay-200">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent animate-scale-in"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl font-display">CompanyPulse</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Our Values"
            centered
            className="mb-16"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-2xl border border-border page-transition-element delay-100">
              <h3 className="text-xl font-medium mb-4">Simplicity</h3>
              <p className="text-muted-foreground">
                We believe complex problems require simple solutions. Our platform is designed to be intuitive and easy to use, while still offering powerful functionality.
              </p>
            </div>
            
            <div className="bg-background p-8 rounded-2xl border border-border page-transition-element delay-200">
              <h3 className="text-xl font-medium mb-4">Efficiency</h3>
              <p className="text-muted-foreground">
                We help businesses save time and resources by streamlining processes and automating routine tasks, allowing teams to focus on what matters most.
              </p>
            </div>
            
            <div className="bg-background p-8 rounded-2xl border border-border page-transition-element delay-300">
              <h3 className="text-xl font-medium mb-4">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously evolve our platform with new features and improvements based on customer feedback and emerging business needs.
              </p>
            </div>
            
            <div className="bg-background p-8 rounded-2xl border border-border page-transition-element delay-400">
              <h3 className="text-xl font-medium mb-4">Security</h3>
              <p className="text-muted-foreground">
                We prioritize the security and privacy of our customers' data with robust security measures and transparent privacy practices.
              </p>
            </div>
            
            <div className="bg-background p-8 rounded-2xl border border-border page-transition-element delay-500">
              <h3 className="text-xl font-medium mb-4">Accessibility</h3>
              <p className="text-muted-foreground">
                We design our platform to be accessible to businesses of all sizes, with flexible plans that grow with your organization.
              </p>
            </div>
            
            <div className="bg-background p-8 rounded-2xl border border-border page-transition-element delay-600">
              <h3 className="text-xl font-medium mb-4">Customer Focus</h3>
              <p className="text-muted-foreground">
                We put our customers at the center of everything we do, with responsive support and a commitment to helping them succeed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Our Team"
            subtitle="We're a dedicated team of designers, developers, and business experts committed to building the best management platform."
            centered
            className="mb-16"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Team members would go here in a real implementation */}
            <div className="text-center page-transition-element delay-100">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 mb-4"></div>
              <h3 className="text-lg font-medium">John Smith</h3>
              <p className="text-sm text-muted-foreground">Founder & CEO</p>
            </div>
            
            <div className="text-center page-transition-element delay-200">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 mb-4"></div>
              <h3 className="text-lg font-medium">Sarah Johnson</h3>
              <p className="text-sm text-muted-foreground">CTO</p>
            </div>
            
            <div className="text-center page-transition-element delay-300">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 mb-4"></div>
              <h3 className="text-lg font-medium">David Lee</h3>
              <p className="text-sm text-muted-foreground">Lead Designer</p>
            </div>
            
            <div className="text-center page-transition-element delay-400">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 mb-4"></div>
              <h3 className="text-lg font-medium">Emily Chen</h3>
              <p className="text-sm text-muted-foreground">Head of Customer Success</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
