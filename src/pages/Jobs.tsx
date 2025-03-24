
import { useState } from 'react';
import { Search, Briefcase, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import PageLayout from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';

// Mock job listings data
const jobListings = [
  {
    id: 1,
    title: 'Senior Product Designer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    description: 'We are looking for a Senior Product Designer to join our team and help create exceptional user experiences.',
    postedDate: '2 days ago',
  },
  {
    id: 2,
    title: 'Marketing Manager',
    company: 'Global Solutions',
    location: 'New York, NY',
    type: 'Full-time',
    description: 'Join our marketing team to develop and implement strategic marketing campaigns for our clients.',
    postedDate: '1 week ago',
  },
  {
    id: 3,
    title: 'Software Engineer',
    company: 'InnovateTech',
    location: 'Remote',
    type: 'Full-time',
    description: 'We are seeking a talented Software Engineer to help build and maintain our core products.',
    postedDate: '3 days ago',
  },
  {
    id: 4,
    title: 'Customer Support Specialist',
    company: 'ServiceFirst',
    location: 'Chicago, IL',
    type: 'Part-time',
    description: 'Join our customer support team to help provide excellent service to our growing customer base.',
    postedDate: '5 days ago',
  },
  {
    id: 5,
    title: 'Financial Analyst',
    company: 'Capital Investments',
    location: 'Boston, MA',
    type: 'Full-time',
    description: 'We are looking for a Financial Analyst to join our team and help with financial planning and analysis.',
    postedDate: '1 day ago',
  },
  {
    id: 6,
    title: 'Graphic Designer',
    company: 'Creative Studios',
    location: 'Los Angeles, CA',
    type: 'Contract',
    description: 'Join our creative team to design visual assets for our clients across various industries.',
    postedDate: '2 weeks ago',
  },
];

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  const filteredJobs = jobListings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
                         
    const matchesLocation = locationFilter === '' || 
                           job.location.toLowerCase().includes(locationFilter.toLowerCase());
                           
    return matchesSearch && matchesLocation;
  });

  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Find Your Next Job"
            subtitle="Browse through our curated list of job opportunities from top companies."
            centered
            className="mb-16"
          />

          <div className="bg-background rounded-2xl border border-border p-6 shadow-subtle mb-12 page-transition-element">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Job title or keyword"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Location"
                  className="pl-10"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              
              <Button className="w-full">Search Jobs</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className={cn(
                    "bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-subtle transition-all duration-300",
                    "page-transition-element",
                    `delay-${index * 100}`
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-xl font-medium mb-1">{job.title}</h3>
                      <div className="text-muted-foreground">{job.company}</div>
                    </div>
                    <Button>Apply Now</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {job.type}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {job.postedDate}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground">{job.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No job listings found matching your criteria.</p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
