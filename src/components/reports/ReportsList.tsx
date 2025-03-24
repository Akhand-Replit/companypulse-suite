
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, DailyReport } from "@/types/userTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReportsListProps {
  reports: DailyReport[];
  loading: boolean;
  user: UserProfile;
  onReportDeleted: (reportId: string) => void;
}

export default function ReportsList({ 
  reports, 
  loading, 
  user, 
  onReportDeleted 
}: ReportsListProps) {
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteReport = async () => {
    if (!selectedReport) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from("daily_reports")
        .delete()
        .eq("id", selectedReport.id)
        .eq("user_id", user.id); // Ensure only the owner can delete
      
      if (error) throw error;
      
      onReportDeleted(selectedReport.id);
      setSelectedReport(null);
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading reports...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">No reports found</h3>
            <p className="text-muted-foreground mt-1">
              Submit your first daily report using the button above
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-medium mb-1">
                  {formatDate(report.date)}
                </h3>
                <p className="text-sm text-muted-foreground">{report.summary.substring(0, 120)}...</p>
                <div className="text-xs text-muted-foreground mt-2">
                  Hours worked: {report.hours_worked}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setViewingReport(report)}
                >
                  View Details
                </Button>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setSelectedReport(report)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* View Report Dialog */}
      <Dialog 
        open={viewingReport !== null} 
        onOpenChange={(open) => !open && setViewingReport(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Daily Report - {viewingReport && formatDate(viewingReport.date)}
            </DialogTitle>
          </DialogHeader>
          
          {viewingReport && (
            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-sm font-medium mb-1">Summary</h4>
                <p className="text-sm">{viewingReport.summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Hours Worked</h4>
                  <p className="text-sm">{viewingReport.hours_worked}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Date Submitted</h4>
                  <p className="text-sm">{formatDate(viewingReport.created_at)}</p>
                </div>
              </div>
              
              {viewingReport.tasks_completed && viewingReport.tasks_completed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Tasks Completed</h4>
                  <ul className="list-disc list-inside text-sm">
                    {viewingReport.tasks_completed.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {viewingReport.challenges && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Challenges Faced</h4>
                  <p className="text-sm">{viewingReport.challenges}</p>
                </div>
              )}
              
              {viewingReport.plans_for_tomorrow && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Plans for Next Day</h4>
                  <p className="text-sm">{viewingReport.plans_for_tomorrow}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewingReport(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={selectedReport !== null} 
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the report from {selectedReport && formatDate(selectedReport.date)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteReport} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
