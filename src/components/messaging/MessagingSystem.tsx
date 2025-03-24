
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Message } from "@/types/userTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Send } from "lucide-react";

interface MessagingSystemProps {
  user: UserProfile;
}

export default function MessagingSystem({ user }: MessagingSystemProps) {
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          profiles:user_id(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("company_id", user.company_id)
        .neq("user_id", user.id);
      
      if (error) throw error;
      
      // Transform data for easier use
      const formattedContacts = data.map(contact => ({
        id: contact.profiles.id,
        first_name: contact.profiles.first_name,
        last_name: contact.profiles.last_name,
        email: contact.profiles.email,
        role: contact.role
      }));
      
      setContacts(formattedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      if (!selectedContact) return;
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedContact}),and(sender_id.eq.${selectedContact},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark received messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === user.id && !msg.read
      );
      
      if (unreadMessages && unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        
        await supabase
          .from("messages")
          .update({ read: true })
          .in("id", unreadIds);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    try {
      setSendingMessage(true);
      
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: selectedContact,
          content: newMessage.trim(),
          read: false
        });
      
      if (error) throw error;
      
      setNewMessage("");
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user.company_id]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages();
    }
  }, [selectedContact]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedContact) {
      // Set up realtime subscription for messages
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${selectedContact}),and(sender_id.eq.${selectedContact},recipient_id.eq.${user.id}))`,
          },
          (payload) => {
            console.log('Messages change received:', payload);
            fetchMessages();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedContact, user.id]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "h:mm a");
    } catch (error) {
      return "";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      return "";
    }
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : "Unknown";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-320px)] min-h-[500px] flex flex-col">
      <div className="mb-4">
        <Label htmlFor="contact-select">Select Contact</Label>
        <Select value={selectedContact} onValueChange={setSelectedContact}>
          <SelectTrigger id="contact-select">
            <SelectValue placeholder="Select a contact" />
          </SelectTrigger>
          <SelectContent>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name} ({contact.role?.replace('_', ' ')})
              </SelectItem>
            ))}
            {contacts.length === 0 && (
              <SelectItem value="no_contacts" disabled>
                No contacts found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex flex-col h-full">
          {selectedContact ? (
            <>
              <div className="p-3 border-b bg-muted/20">
                <h3 className="font-medium">{getContactName(selectedContact)}</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isFirstMessage = index === 0 || 
                        formatDate(messages[index-1].created_at) !== formatDate(message.created_at);
                      
                      const isSentByMe = message.sender_id === user.id;
                      
                      return (
                        <div key={message.id}>
                          {isFirstMessage && (
                            <div className="text-center my-4">
                              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                          )}
                          
                          <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                              isSentByMe 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                              <div className="text-xs mt-1 opacity-70 text-right">
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sendingMessage}
                  />
                  <Button 
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              <p>Select a contact to start messaging</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
