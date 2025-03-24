import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/userTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessagingSystemProps {
  user: UserProfile;
}

export default function MessagingSystem({ user }: MessagingSystemProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // First get all user_roles in the same company
        const { data: userRolesData, error: userRolesError } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("company_id", user.company_id);
          
        if (userRolesError) throw userRolesError;
        
        // Then get the profile information for each user
        if (userRolesData && userRolesData.length > 0) {
          const fetchedUsers: UserProfile[] = [];
          
          for (const userRole of userRolesData) {
            if (userRole.user_id !== user.id) { // Exclude current user
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, email")
                .eq("id", userRole.user_id)
                .single();
                
              if (!profileError && profileData) {
                fetchedUsers.push({
                  id: profileData.id,
                  first_name: profileData.first_name,
                  last_name: profileData.last_name,
                  email: profileData.email,
                  role: userRole.role
                });
              }
            }
          }
          
          setUsers(fetchedUsers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user.company_id) {
      fetchUsers();
    }
  }, [user.id, user.company_id]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id}, recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id}, recipient_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchMessages();

    // Subscribe to real-time message updates
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser?.id}),and(sender_id.eq.${selectedUser?.id},recipient_id.eq.${user.id}))`,
        },
        (payload) => {
          console.log('Message change received:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, user.id]);

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedUser.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 h-96">
      {/* User List */}
      <div className="md:col-span-1 p-4 border-r">
        <h3 className="text-lg font-semibold mb-4">Users</h3>
        <ScrollArea className="h-[320px] rounded-md border">
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : users.length > 0 ? (
              users.map((u) => (
                <Button
                  key={u.id}
                  variant="ghost"
                  className={`w-full justify-start ${
                    selectedUser?.id === u.id ? "bg-secondary" : ""
                  }`}
                  onClick={() => setSelectedUser(u)}
                >
                  <Avatar className="mr-2 h-6 w-6">
                    <AvatarImage src={`https://avatar.vercel.sh/${u.email}.png`} />
                    <AvatarFallback>{u.first_name?.[0]}{u.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  {u.first_name} {u.last_name}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No other users found.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className="md:col-span-3 p-4">
        {!selectedUser ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Select a user to start messaging.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold">
                {selectedUser.first_name} {selectedUser.last_name}
              </h3>
            </div>
            <ScrollArea className="flex-grow">
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-md ${
                      msg.sender_id === user.id ? "bg-blue-100 ml-auto w-fit" : "bg-gray-100 mr-auto w-fit"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="mt-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
