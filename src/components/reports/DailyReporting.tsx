
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, DailyReport } from "@/types/userTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CreateReportForm from "./CreateReportForm";
import ReportsList from "./ReportsList";

interface DailyReportingProps {
  user: UserProfile;
}

export default function DailyReporting({ user }: DailyReportingProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [creatingReport, setCreatingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayReportExists, setTodayReportExists] = useState(false);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      
      if (error) throw error;
      
      setReports(data || []);
      
      // Check if a report for today already exists
      const today = format(new Date(), "yyyy-MM-dd");
      const todayReport = data?.find(report => format(new Date(report.date), "yyyy-MM-dd") === today);
      setTodayReportExists(!!todayReport);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    
    // Set up realtime subscription for reports
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_reports',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Reports change received:', payload);
          fetchReports();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleReportCreated = () => {
    setCreatingReport(false);
    fetchReports();
    toast({
      title: "Success",
      description: "Daily report submitted successfully",
    });
  };

  const handleReportDeleted = (reportId: string) => {
    setReports(prev => prev.filter(report => report.id !== reportId));
    fetchReports(); // Refetch to update todayReportExists state
    toast({
      title: "Success",
      description: "Report deleted successfully",
    });
  };

  return (
    <div className="space-y-6">
      {creatingReport ? (
        <Card>
          <CardHeader>
            <CardTitle>Submit Daily Report</CardTitle>
            <CardDescription>Summarize your work for today</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateReportForm 
              user={user} 
              onReportCreated={handleReportCreated} 
              onCancel={() => setCreatingReport(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Daily Reports</h2>
          <Button 
            onClick={() => setCreatingReport(true)}
            disabled={todayReportExists}
          >
            {todayReportExists ? "Today's Report Submitted" : "Submit Today's Report"}
          </Button>
        </div>
      )}
      
      {!creatingReport && (
        <ReportsList 
          reports={reports} 
          loading={loading} 
          user={user}
          onReportDeleted={handleReportDeleted}
        />
      )}
    </div>
  );
}
