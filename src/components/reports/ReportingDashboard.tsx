import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, DailyReport } from "@/types/userTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TeamReporting from "./TeamReporting";

// Define the TeamReportingProps interface first
interface TeamReportingProps {
  user: UserProfile;
  teamMembers?: UserProfile[];
  isAdmin?: boolean; // Add the missing property
}

interface ReportingDashboardProps {
  user: UserProfile;
}

export default function ReportingDashboard({ user }: ReportingDashboardProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [totalHours, setTotalHours] = useState(0);
  const [averageHours, setAverageHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsManager(user.role === 'manager' || user.role === 'assistant_manager');
    setIsAdmin(user.role === 'admin' || user.role === 'company_admin');
  }, [user.role]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Modify the query to handle daily reports
        const { data, error } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });
         
        if (error) throw error;
        
        // Type assertion for DailyReport compatibility
        setReports((data || []) as DailyReport[]);
        
        // Calculate report metrics
        if (data && data.length > 0) {
          const total = data.reduce((acc, report) => acc + report.hours_worked, 0);
          setTotalHours(total);
          setAverageHours(total / data.length);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "Error",
          description: "Failed to load report data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [user.id]);

  const filteredReports = selectedDate
    ? reports.filter(report => {
        const reportDate = new Date(report.date);
        return (
          reportDate.getFullYear() === selectedDate.getFullYear() &&
          reportDate.getMonth() === selectedDate.getMonth() &&
          reportDate.getDate() === selectedDate.getDate()
        );
      })
    : reports;
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="my" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my">My Reports</TabsTrigger>
          <TabsTrigger value="team">Team Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Overview</CardTitle>
              <CardDescription>Summary of your daily reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Total Hours Reported</h4>
                  <p className="text-2xl font-bold">{totalHours} hours</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Average Hours per Day</h4>
                  <p className="text-2xl font-bold">{averageHours.toFixed(2)} hours</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Filter by Date</h4>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={loading}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your recent daily reports</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading reports...</p>
              ) : filteredReports.length > 0 ? (
                <ul className="space-y-3">
                  {filteredReports.map((report) => (
                    <li key={report.id} className="border rounded-md p-4">
                      <div className="font-medium">{new Date(report.date).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground">{report.summary}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Hours worked: {report.hours_worked}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No reports found for the selected date.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team" className="pt-4">
        {(isManager || isAdmin) ? (
          <TeamReporting 
            user={user} 
            isAdmin={isAdmin} 
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground py-8">
                Only managers and administrators can view team reports.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      </Tabs>
    </div>
  );
}
