import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Task } from "@/types/userTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  user: UserProfile;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  isManager?: boolean;
  isAdmin?: boolean;
}

export default function TaskList({ 
  tasks, 
  loading, 
  user, 
  onTaskUpdated, 
  onTaskDeleted,
  isManager = false,
  isAdmin = false 
}: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) return;
    
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedTask.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        onTaskUpdated(data as Task);
        toast({
          title: "Status Updated",
          description: `Task status changed to ${newStatus.replace('_', ' ')}`,
        });
      }
      
      setSelectedTask(null);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    try {
      setIsUpdating(true);
      
      // Only admins, managers, or the task creator can delete tasks
      if (!isAdmin && !isManager && selectedTask.assigned_by !== user.id) {
        throw new Error("You don't have permission to delete this task");
      }
      
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", selectedTask.id);
      
      if (error) throw error;
      
      onTaskDeleted(selectedTask.id);
      toast({
        title: "Task Deleted",
        description: "The task has been successfully deleted",
      });
      
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-muted-foreground mt-1">
              {isManager || isAdmin 
                ? "Create a new task to get started" 
                : "You don't have any tasks in this category"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-medium">{task.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusClass(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {task.description || "No description provided"}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {task.due_date && (
                    <div>
                      <span className="font-medium">Due: </span>
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created: </span>
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedTask(task);
                    setNewStatus(task.status);
                  }}
                >
                  Update Status
                </Button>
                
                {(isAdmin || isManager || task.assigned_by === user.id) && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      const taskWithDeleteFlag = {...task};
                      setSelectedTask({...task, status: task.status});
                      setSelectedTask({...task, _deleteConfirmation: true} as Task);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Dialog 
        open={selectedTask !== null && !selectedTask._deleteConfirmation} 
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Change the status of "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select 
              value={newStatus} 
              onValueChange={setNewStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating || newStatus === selectedTask?.status}>
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog 
        open={selectedTask !== null && selectedTask._deleteConfirmation} 
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={isUpdating}>
              {isUpdating ? "Deleting..." : "Delete Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
