
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, DailyReport } from "@/types/userTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import DailyReporting from "./DailyReporting";
import TeamReporting from "./TeamReporting";

interface ReportingDashboardProps {
  user: UserProfile;
  isManager?: boolean;
  isAdmin?: boolean;
}

export default function ReportingDashboard({ user, isManager = false, isAdmin = false }: ReportingDashboardProps) {
  const [recentReports, setRecentReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecentReports = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from("daily_reports")
          .select("*");
          
        if (!isAdmin && !isManager) {
          // Regular employee - only see their own reports
          query = query.eq("user_id", user.id);
        } else if (isManager && !isAdmin) {
          // Manager - see reports for their branch
          if (user.branch_id) {
            query = query.eq("branch_id", user.branch_id);
          }
        } else if (isAdmin) {
          // Admin - see reports for their company
          if (user.company_id) {
            query = query.eq("company_id", user.company_id);
          }
        }
        
        query = query.order("date", { ascending: false }).limit(5);
        
        const { data, error } = await query;
        
        if (error) throw error;
        setRecentReports(data || []);
      } catch (error) {
        console.error("Error fetching recent reports:", error);
        toast({
          title: "Error",
          description: "Failed to load recent reports.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReports();
  }, [user.id, user.branch_id, user.company_id, isManager, isAdmin, toast]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-reports" className="w-full">
        <TabsList>
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          {(isManager || isAdmin) && (
            <TabsTrigger value="team-reports">Team Reports</TabsTrigger>
          )}
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-reports" className="pt-4">
          <DailyReporting user={user} />
        </TabsContent>
        
        {(isManager || isAdmin) && (
          <TabsContent value="team-reports" className="pt-4">
            <TeamReporting user={user} isAdmin={isAdmin} />
          </TabsContent>
        )}
        
        <TabsContent value="overview" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Summary of the most recent daily reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading recent reports...</div>
              ) : recentReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead className="text-right">Tasks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{formatDate(report.date)}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {report.summary}
                        </TableCell>
                        <TableCell>{report.hours_worked}</TableCell>
                        <TableCell className="text-right">
                          {report.tasks_completed ? report.tasks_completed.length : 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No reports found. Start by submitting your first daily report.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
