
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/userTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CreateReportFormProps {
  user: UserProfile;
  onReportCreated: () => void;
  onCancel: () => void;
}

export default function CreateReportForm({ 
  user, 
  onReportCreated, 
  onCancel 
}: CreateReportFormProps) {
  const [summary, setSummary] = useState("");
  const [hoursWorked, setHoursWorked] = useState(8);
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [challenges, setChallenges] = useState("");
  const [plansForTomorrow, setPlansForTomorrow] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!summary) {
        toast({
          title: "Required Field",
          description: "Please enter a summary of your day",
          variant: "destructive",
        });
        return;
      }
      
      // Parse tasks completed string into array
      const tasksArray = tasksCompleted.split(',')
        .map(task => task.trim())
        .filter(task => task);
      
      const newReport = {
        user_id: user.id,
        company_id: user.company_id,
        branch_id: user.branch_id,
        date: new Date().toISOString(),
        summary,
        hours_worked: hoursWorked,
        tasks_completed: tasksArray.length > 0 ? tasksArray : null,
        challenges: challenges || null,
        plans_for_tomorrow: plansForTomorrow || null
      };
      
      const { error } = await supabase
        .from("daily_reports")
        .insert(newReport);
      
      if (error) throw error;
      
      onReportCreated();
    } catch (error) {
      console.error("Error creating report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="summary">Daily Summary *</Label>
        <Textarea
          id="summary"
          placeholder="Summarize what you accomplished today"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="min-h-24"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="hours">Hours Worked</Label>
        <Input
          id="hours"
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={hoursWorked}
          onChange={(e) => setHoursWorked(parseFloat(e.target.value))}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tasks">Completed Tasks</Label>
        <Textarea
          id="tasks"
          placeholder="List tasks you completed today (comma-separated)"
          value={tasksCompleted}
          onChange={(e) => setTasksCompleted(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="challenges">Challenges Faced</Label>
        <Textarea
          id="challenges"
          placeholder="Any challenges or blockers you encountered"
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="plans">Plans for Tomorrow</Label>
        <Textarea
          id="plans"
          placeholder="What do you plan to work on tomorrow"
          value={plansForTomorrow}
          onChange={(e) => setPlansForTomorrow(e.target.value)}
        />
      </div>
      
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
