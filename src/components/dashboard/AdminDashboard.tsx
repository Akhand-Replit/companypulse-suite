import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Company, Branch } from "@/types/userTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import TaskManagement from "@/components/tasks/TaskManagement";
import CompanyOverview from "@/components/admin/CompanyOverview";
import BranchOverview from "@/components/admin/BranchOverview";
import MessagingSystem from "@/components/messaging/MessagingSystem";

interface AdminDashboardProps {
  user: UserProfile;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employeeStats, setEmployeeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user.company_id) return;
        
        // Fetch company data
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", user.company_id)
          .single();

        if (companyError) throw companyError;
        setCompanyData(companyData);
        
        // Fetch branches
        const { data: branchesData, error: branchesError } = await supabase
          .from("branches")
          .select("*")
          .eq("company_id", user.company_id);

        if (branchesError) throw branchesError;
        setBranches(branchesData);
        
        // Update the role statistics fetching logic
        const { data: roleStats, error: roleStatsError } = await supabase
          .from("user_roles")
          .select("role");
          
        if (roleStatsError) throw roleStatsError;
        
        if (roleStats) {
          // Count roles manually
          const roleCounts: Record<string, number> = {};
          roleStats.forEach(item => {
            const role = item.role;
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          });
          
          // Format for chart
          const formattedRoleStats = Object.entries(roleCounts).map(([role, count]) => ({
            name: role.replace('_', ' '),
            value: count
          }));
          
          setEmployeeStats(formattedRoleStats);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.company_id]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
                <CardDescription>Key metrics for {companyData?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading company data...</p>
                ) : companyData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">Branches</div>
                        <div className="text-2xl font-bold">{branches.length}</div>
                        <div className="text-xs text-muted-foreground">Limit: {companyData.branches_limit}</div>
                      </div>
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">Subscription</div>
                        <div className="text-xl font-bold capitalize">{companyData.subscription_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {companyData.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {companyData.description || 'No description available.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No company data available.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Employee Distribution</CardTitle>
                <CardDescription>Employees by role</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : employeeStats.length > 0 ? (
                  <div className="h-64">
                    <ChartContainer config={{}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={employeeStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {employeeStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No employee data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Branch Overview</CardTitle>
              <CardDescription>All branches in your company</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading branch data...</p>
              ) : branches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map(branch => (
                    <div key={branch.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{branch.name}</h3>
                        {branch.is_headquarters && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">HQ</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {branch.city}{branch.state ? `, ${branch.state}` : ''}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {branch.phone || 'No phone'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {branch.email || 'No email'}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        Manage Branch
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No branches found for your company.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="company" className="pt-4">
          <CompanyOverview user={user} company={companyData} />
        </TabsContent>
        
        <TabsContent value="branches" className="pt-4">
          <BranchOverview user={user} branches={branches} />
        </TabsContent>
        
        <TabsContent value="tasks" className="pt-4">
          <TaskManagement user={user} isAdmin={true} />
        </TabsContent>
        
        <TabsContent value="messages" className="pt-4">
          <MessagingSystem user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
