
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Task, DailyReport } from "@/types/userTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import TaskManagement from "@/components/tasks/TaskManagement";
import DailyReporting from "@/components/reports/DailyReporting";
import TeamReporting from "@/components/reports/TeamReporting";
import MessagingSystem from "@/components/messaging/MessagingSystem";

interface ManagerDashboardProps {
  user: UserProfile;
}

export default function ManagerDashboard({ user }: ManagerDashboardProps) {
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [taskStats, setTaskStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user.branch_id) return;
        
        // Fetch team members - modified to use separate queries
        const { data: teamRoles, error: teamError } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("branch_id", user.branch_id)
          .eq("role", "employee");

        if (teamError) throw teamError;
        
        // For each user_id, fetch the profile data
        if (teamRoles && teamRoles.length > 0) {
          const userProfiles: UserProfile[] = [];
          
          for (const role of teamRoles) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .eq("id", role.user_id)
              .single();
              
            if (!profileError && profileData) {
              userProfiles.push({
                id: profileData.id,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email,
                role: role.role,
                branch_id: user.branch_id,
                company_id: user.company_id
              });
            }
          }
          
          setTeamMembers(userProfiles);
        }
        
        // Fetch task statistics
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("status, count(*)")
          .eq("branch_id", user.branch_id)
          .eq("status", "pending")
          .or("status.eq.in_progress,status.eq.completed,status.eq.cancelled");

        if (tasksError) throw tasksError;
        
        // Since we can't use group, let's calculate counts manually
        const taskCounts = {
          'pending': 0,
          'in_progress': 0,
          'completed': 0,
          'cancelled': 0
        };
        
        // Count tasks by status
        if (tasksData) {
          for (const task of tasksData) {
            if (task.status in taskCounts) {
              taskCounts[task.status as keyof typeof taskCounts]++;
            }
          }
        }
        
        // Format for chart
        const formattedTaskStats = [
          { name: 'Pending', count: taskCounts['pending'] },
          { name: 'In Progress', count: taskCounts['in_progress'] },
          { name: 'Completed', count: taskCounts['completed'] },
          { name: 'Cancelled', count: taskCounts['cancelled'] }
        ];
        
        setTaskStats(formattedTaskStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.branch_id, user.company_id]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="team-reports">Team Reports</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Task Overview</CardTitle>
                <CardDescription>Distribution of tasks by status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ChartContainer config={{
                      Pending: { theme: { light: "#FFC107", dark: "#FFC107" } },
                      "In Progress": { theme: { light: "#3B82F6", dark: "#3B82F6" } },
                      Completed: { theme: { light: "#10B981", dark: "#10B981" } },
                      Cancelled: { theme: { light: "#EF4444", dark: "#EF4444" } },
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={taskStats}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="count" name="Tasks" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Employees in your branch</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading team data...</p>
                ) : teamMembers.length > 0 ? (
                  <ul className="space-y-3">
                    {teamMembers.map((member) => (
                      <li key={member.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">{member.first_name} {member.last_name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No team members found in your branch.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="pt-4">
          <TaskManagement user={user} isManager={true} />
        </TabsContent>
        
        <TabsContent value="my-reports" className="pt-4">
          <DailyReporting user={user} />
        </TabsContent>
        
        <TabsContent value="team-reports" className="pt-4">
          <TeamReporting user={user} teamMembers={teamMembers} />
        </TabsContent>
        
        <TabsContent value="messages" className="pt-4">
          <MessagingSystem user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
