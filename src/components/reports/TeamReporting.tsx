
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, DailyReport } from "@/types/userTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface TeamReportingProps {
  user: UserProfile;
  teamMembers: UserProfile[];
}

export default function TeamReporting({ user, teamMembers }: TeamReportingProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("week");
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      if (!user.branch_id || !selectedMember) return;
      
      // Calculate date range
      const today = new Date();
      let startDate = new Date();
      
      if (dateRange === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (dateRange === "month") {
        startDate.setMonth(today.getMonth() - 1);
      } else {
        startDate.setDate(today.getDate() - 1); // Yesterday
      }
      
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", selectedMember)
        .eq("branch_id", user.branch_id)
        .gte("date", startDate.toISOString())
        .lte("date", today.toISOString())
        .order("date", { ascending: false });
      
      if (error) throw error;
      
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching team reports:", error);
      toast({
        title: "Error",
        description: "Failed to load team reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMember) {
      fetchReports();
    }
  }, [selectedMember, dateRange, user.branch_id]);

  useEffect(() => {
    // Set the first team member as default when the list loads
    if (teamMembers.length > 0 && !selectedMember) {
      setSelectedMember(teamMembers[0].id);
    }
  }, [teamMembers]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 space-y-2">
          <Label htmlFor="team-member">Select Team Member</Label>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger id="team-member">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </SelectItem>
              ))}
              {teamMembers.length === 0 && (
                <SelectItem value="no_members" disabled>
                  No team members found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/2 space-y-2">
          <Label htmlFor="date-range">Date Range</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger id="date-range">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading team reports...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">{formatDate(report.date)}</h3>
                    <div className="text-sm bg-primary/10 px-2 py-1 rounded">
                      {report.hours_worked} hours
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Summary</h4>
                    <p className="text-sm">{report.summary}</p>
                  </div>
                  
                  {report.tasks_completed && report.tasks_completed.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Tasks Completed</h4>
                      <ul className="list-disc list-inside text-sm">
                        {report.tasks_completed.map((task, index) => (
                          <li key={index}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.challenges && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Challenges Faced</h4>
                      <p className="text-sm">{report.challenges}</p>
                    </div>
                  )}
                  
                  {report.plans_for_tomorrow && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Plans for Next Day</h4>
                      <p className="text-sm">{report.plans_for_tomorrow}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No reports found</h3>
              <p className="text-muted-foreground mt-1">
                {selectedMember 
                  ? `No reports found for the selected time period` 
                  : "Select a team member to view their reports"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
