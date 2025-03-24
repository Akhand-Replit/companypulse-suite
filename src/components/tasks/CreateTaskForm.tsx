
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/userTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTaskFormProps {
  user: UserProfile;
  onTaskCreated: () => void;
  onCancel: () => void;
  isManager?: boolean;
  isAdmin?: boolean;
}

export default function CreateTaskForm({ 
  user, 
  onTaskCreated, 
  onCancel,
  isManager = false,
  isAdmin = false
}: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeam, setFetchingTeam] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setFetchingTeam(true);
        
        // First get all user_roles for the team members we want to fetch
        let query = supabase
          .from("user_roles")
          .select("user_id, role");
        
        // Filter based on role
        if (isAdmin) {
          // Admin can assign to anyone in the company
          query = query.eq("company_id", user.company_id);
        } else if (isManager) {
          // Manager can only assign to employees in their branch
          query = query.eq("branch_id", user.branch_id).eq("role", "employee");
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Then get the profile information for each user
        if (data && data.length > 0) {
          const formattedTeamData: UserProfile[] = [];
          
          for (const userRole of data) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .eq("id", userRole.user_id)
              .single();
              
            if (!profileError && profileData) {
              formattedTeamData.push({
                id: profileData.id,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email,
                role: userRole.role
              });
            }
          }
          
          setTeamMembers(formattedTeamData);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
      } finally {
        setFetchingTeam(false);
      }
    };

    fetchTeamMembers();
  }, [user.company_id, user.branch_id, isManager, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!title) {
        toast({
          title: "Required Field",
          description: "Please enter a task title",
          variant: "destructive",
        });
        return;
      }
      
      if (!assignedTo) {
        toast({
          title: "Required Field",
          description: "Please select an employee to assign the task to",
          variant: "destructive",
        });
        return;
      }
      
      const newTask = {
        title,
        description,
        status: "pending" as const,
        priority,
        due_date: date ? date.toISOString() : null,
        assigned_to: assignedTo,
        assigned_by: user.id,
        company_id: user.company_id,
        branch_id: user.branch_id
      };
      
      const { error } = await supabase
        .from("tasks")
        .insert(newTask);
      
      if (error) throw error;
      
      onTaskCreated();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input
          id="title"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-24"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assign To *</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger>
            <SelectValue placeholder={fetchingTeam ? "Loading team members..." : "Select an employee"} />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.first_name} {member.last_name} {member.role && `(${member.role.replace('_', ' ')})`}
              </SelectItem>
            ))}
            {teamMembers.length === 0 && !fetchingTeam && (
              <SelectItem value="no_members" disabled>
                No team members found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
