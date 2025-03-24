
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import { UserProfile, Task, DailyReport } from "@/types/userTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import ReportingDashboard from "@/components/reports/ReportingDashboard";
import TaskManagement from "@/components/tasks/TaskManagement";

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        const { data: userRolesData, error: userRolesError } = await supabase
          .from("user_roles")
          .select(`
            role,
            company_id,
            branch_id,
            companies(name),
            branches(name)
          `)
          .eq("user_id", session.user.id)
          .single();

        if (userRolesError) throw userRolesError;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;

        setUser({
          id: session.user.id,
          email: profileData.email || session.user.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          role: userRolesData?.role,
          company_id: userRolesData?.company_id,
          branch_id: userRolesData?.branch_id,
          company_name: userRolesData?.companies?.name,
          branch_name: userRolesData?.branches?.name
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center items-center h-64">
                <p className="text-lg">Loading dashboard...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const renderDashboardByRole = () => {
    switch(user.role) {
      case 'admin':
      case 'company_admin':
        return <AdminDashboard user={user} />;
      case 'manager':
      case 'assistant_manager':
        return <ManagerDashboard user={user} />;
      case 'employee':
        return <EmployeeDashboard user={user} />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Your account doesn't have access to any dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Please contact your administrator for assistance.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user.first_name} {user.last_name}</h1>
        <div className="mb-4">
          <p className="text-muted-foreground">
            {user.role && user.role.replace('_', ' ')} {user.company_name ? `at ${user.company_name}` : ''}
            {user.branch_name ? ` (${user.branch_name})` : ''}
          </p>
        </div>
        {renderDashboardByRole()}
      </div>
    </PageLayout>
  );
}
