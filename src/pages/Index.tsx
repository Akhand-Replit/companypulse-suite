
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import PageLayout from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to check authentication status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <SectionHeading
          title="Akhand HRMS"
          subtitle="Complete Human Resource Management Solution"
          centered
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Company Management</h3>
              <p className="text-muted-foreground mb-4">
                Configure your company structure, branches, and departments.
              </p>
              <Button 
                onClick={() => 
                  isAuthenticated 
                    ? navigate("/company") 
                    : navigate("/auth")
                }
                className="w-full"
              >
                {isAuthenticated ? "Manage Company" : "Sign In to Access"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Employee Management</h3>
              <p className="text-muted-foreground mb-4">
                Manage employees, roles, and performance tracking.
              </p>
              <Button 
                onClick={() => 
                  isAuthenticated 
                    ? navigate("/employees") 
                    : navigate("/auth")
                }
                className="w-full"
              >
                {isAuthenticated ? "Manage Employees" : "Sign In to Access"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Job Board</h3>
              <p className="text-muted-foreground mb-4">
                Post job openings, manage applications, and hire the best talent.
              </p>
              <Button 
                onClick={() => navigate("/jobs")}
                className="w-full"
                variant="outline"
              >
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        </div>

        {!isAuthenticated && !loading && (
          <div className="flex justify-center">
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="px-8 py-6 text-lg"
            >
              Sign In / Register
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Index;
