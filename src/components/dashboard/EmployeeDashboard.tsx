
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Task, DailyReport } from "@/types/userTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TaskManagement from "@/components/tasks/TaskManagement";
import DailyReporting from "@/components/reports/DailyReporting";
import MessagingSystem from "@/components/messaging/MessagingSystem";

interface EmployeeDashboardProps {
  user: UserProfile;
}

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentReports, setRecentReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (tasksError) throw tasksError;
        setRecentTasks(tasksData || []);
        
        // Fetch recent reports
        const { data: reportsData, error: reportsError } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(5);

        if (reportsError) throw reportsError;
        setRecentReports(reportsData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.id]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="reports">Daily Reports</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Your most recent assigned tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading tasks...</p>
                ) : recentTasks.length > 0 ? (
                  <ul className="space-y-2">
                    {recentTasks.map((task) => (
                      <li key={task.id} className="p-2 border rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{task.title}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.priority === 'high' || task.priority === 'urgent' 
                              ? 'bg-red-100 text-red-800' 
                              : task.priority === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Status: {task.status.replace('_', ' ')}
                        </div>
                        {task.due_date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No tasks assigned to you yet.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Your recently submitted daily reports</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading reports...</p>
                ) : recentReports.length > 0 ? (
                  <ul className="space-y-2">
                    {recentReports.map((report) => (
                      <li key={report.id} className="p-2 border rounded">
                        <div className="font-medium">
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm truncate">{report.summary}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Hours worked: {report.hours_worked}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No daily reports submitted yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="pt-4">
          <TaskManagement user={user} />
        </TabsContent>
        
        <TabsContent value="reports" className="pt-4">
          <DailyReporting user={user} />
        </TabsContent>
        
        <TabsContent value="messages" className="pt-4">
          <MessagingSystem user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
