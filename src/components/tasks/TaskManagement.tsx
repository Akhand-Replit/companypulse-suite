import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Task } from "@/types/userTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TaskList from "./TaskList";
import CreateTaskForm from "./CreateTaskForm";

interface TaskManagementProps {
  user: UserProfile;
  isManager?: boolean;
  isAdmin?: boolean;
}

export default function TaskManagement({ user, isManager = false, isAdmin = false }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from("tasks").select("*");
      
      // Filter based on user role
      if (!isAdmin && !isManager) {
        // Regular employee - only see their own tasks
        query = query.eq("assigned_to", user.id);
      } else if (isManager && !isAdmin) {
        // Manager - see tasks for their branch
        if (user.branch_id) {
          query = query.eq("branch_id", user.branch_id);
        }
      } else if (isAdmin) {
        // Admin - see tasks for their company
        if (user.company_id) {
          query = query.eq("company_id", user.company_id);
        }
      }
      
      // Order by creation date, newest first
      query = query.order("created_at", { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Type assertion to ensure compatibility with Task interface
      setTasks((data || []) as Task[]);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Set up realtime subscription for tasks
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Tasks change received:', payload);
          fetchTasks();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, user.branch_id, user.company_id, isManager, isAdmin]);

  const handleTaskCreated = () => {
    setCreatingTask(false);
    fetchTasks();
    toast({
      title: "Success",
      description: "Task created successfully",
    });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    toast({
      title: "Success",
      description: "Task updated successfully",
    });
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Success",
      description: "Task deleted successfully",
    });
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-6">
      {creatingTask ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Assign a task to a team member</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTaskForm 
              user={user} 
              onTaskCreated={handleTaskCreated} 
              onCancel={() => setCreatingTask(false)}
              isManager={isManager}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Task Management</h2>
          {(isManager || isAdmin) && (
            <Button onClick={() => setCreatingTask(true)}>Create New Task</Button>
          )}
        </div>
      )}
      
      {!creatingTask && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="pt-4">
            <TaskList 
              tasks={tasks} 
              loading={loading} 
              user={user}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              isManager={isManager}
              isAdmin={isAdmin}
            />
          </TabsContent>
          
          <TabsContent value="pending" className="pt-4">
            <TaskList 
              tasks={getTasksByStatus('pending')} 
              loading={loading} 
              user={user}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              isManager={isManager}
              isAdmin={isAdmin}
            />
          </TabsContent>
          
          <TabsContent value="in_progress" className="pt-4">
            <TaskList 
              tasks={getTasksByStatus('in_progress')} 
              loading={loading} 
              user={user}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              isManager={isManager}
              isAdmin={isAdmin}
            />
          </TabsContent>
          
          <TabsContent value="completed" className="pt-4">
            <TaskList 
              tasks={getTasksByStatus('completed')} 
              loading={loading} 
              user={user}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              isManager={isManager}
              isAdmin={isAdmin}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
