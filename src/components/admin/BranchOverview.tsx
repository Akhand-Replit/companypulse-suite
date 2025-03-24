
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Branch } from "@/types/userTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface BranchOverviewProps {
  user: UserProfile;
  branches: Branch[];
}

export default function BranchOverview({ user, branches }: BranchOverviewProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateBranch = async () => {
    try {
      setLoading(true);
      
      if (!name || !city) {
        toast({
          title: "Required Fields",
          description: "Branch name and city are required",
          variant: "destructive",
        });
        return;
      }
      
      // Check if we're trying to set a new HQ when one already exists
      if (isHeadquarters) {
        const existingHQ = branches.find(branch => branch.is_headquarters);
        if (existingHQ) {
          const { error: updateError } = await supabase
            .from("branches")
            .update({ is_headquarters: false })
            .eq("id", existingHQ.id);
          
          if (updateError) throw updateError;
        }
      }
      
      const newBranch = {
        name,
        company_id: user.company_id,
        address: address || null,
        city,
        state: state || null,
        country: country || null,
        zip_code: zipCode || null,
        phone: phone || null,
        email: email || null,
        is_headquarters: isHeadquarters
      };
      
      const { error } = await supabase
        .from("branches")
        .insert(newBranch);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Branch created successfully",
      });
      
      setIsCreating(false);
      // Refresh the page to load the new branch
      window.location.reload();
    } catch (error) {
      console.error("Error creating branch:", error);
      toast({
        title: "Error",
        description: "Failed to create branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!selectedBranch) return;
    
    try {
      setLoading(true);
      
      if (!name || !city) {
        toast({
          title: "Required Fields",
          description: "Branch name and city are required",
          variant: "destructive",
        });
        return;
      }
      
      // Check if we're trying to set a new HQ when another one already exists
      if (isHeadquarters && !selectedBranch.is_headquarters) {
        const existingHQ = branches.find(branch => 
          branch.is_headquarters && branch.id !== selectedBranch.id
        );
        
        if (existingHQ) {
          const { error: updateError } = await supabase
            .from("branches")
            .update({ is_headquarters: false })
            .eq("id", existingHQ.id);
          
          if (updateError) throw updateError;
        }
      }
      
      const updatedBranch = {
        name,
        address: address || null,
        city,
        state: state || null,
        country: country || null,
        zip_code: zipCode || null,
        phone: phone || null,
        email: email || null,
        is_headquarters: isHeadquarters
      };
      
      const { error } = await supabase
        .from("branches")
        .update(updatedBranch)
        .eq("id", selectedBranch.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Branch updated successfully",
      });
      
      setIsEditing(false);
      setSelectedBranch(null);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating branch:", error);
      toast({
        title: "Error",
        description: "Failed to update branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranch) return;
    
    try {
      setLoading(true);
      
      // Check if this is the only branch
      if (branches.length <= 1) {
        toast({
          title: "Cannot Delete",
          description: "You must have at least one branch",
          variant: "destructive",
        });
        return;
      }
      
      // Check if this is HQ
      if (selectedBranch.is_headquarters) {
        toast({
          title: "Cannot Delete",
          description: "You cannot delete the headquarters branch",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", selectedBranch.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Branch deleted successfully",
      });
      
      setIsDeleting(false);
      setSelectedBranch(null);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast({
        title: "Error",
        description: "Failed to delete branch. It may have associated employees or tasks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setName(branch.name);
    setAddress(branch.address || "");
    setCity(branch.city || "");
    setState(branch.state || "");
    setCountry(branch.country || "");
    setZipCode(branch.zip_code || "");
    setPhone(branch.phone || "");
    setEmail(branch.email || "");
    setIsHeadquarters(branch.is_headquarters);
    setIsEditing(true);
  };

  const handleDeleteClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDeleting(true);
  };

  const handleCreateClick = () => {
    setName("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("");
    setZipCode("");
    setPhone("");
    setEmail("");
    setIsHeadquarters(false);
    setIsCreating(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("");
    setZipCode("");
    setPhone("");
    setEmail("");
    setIsHeadquarters(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Branch Management</h2>
        <Button onClick={handleCreateClick}>Create New Branch</Button>
      </div>
      
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <Card key={branch.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{branch.name}</CardTitle>
                      <CardDescription>
                        {branch.city}{branch.state ? `, ${branch.state}` : ''}
                      </CardDescription>
                    </div>
                    {branch.is_headquarters && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">HQ</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {branch.address && (
                      <div className="text-sm">
                        <span className="font-medium">Address: </span>
                        {branch.address}
                      </div>
                    )}
                    
                    {branch.phone && (
                      <div className="text-sm">
                        <span className="font-medium">Phone: </span>
                        {branch.phone}
                      </div>
                    )}
                    
                    {branch.email && (
                      <div className="text-sm">
                        <span className="font-medium">Email: </span>
                        {branch.email}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Created on {formatDate(branch.created_at)}
                    </div>
                    
                    <div className="flex gap-2 pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditClick(branch)}
                      >
                        Edit
                      </Button>
                      
                      {!branch.is_headquarters && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDeleteClick(branch)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(branch => (
                    <tr key={branch.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{branch.name}</td>
                      <td className="p-4">
                        {branch.city}{branch.state ? `, ${branch.state}` : ''}
                        {branch.country ? `, ${branch.country}` : ''}
                      </td>
                      <td className="p-4">
                        {branch.phone || branch.email || "Not specified"}
                      </td>
                      <td className="p-4">
                        {branch.is_headquarters ? (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            Headquarters
                          </span>
                        ) : "Branch"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditClick(branch)}
                          >
                            Edit
                          </Button>
                          
                          {!branch.is_headquarters && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteClick(branch)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Branch Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  required 
                />
                
                <Label htmlFor="state" className="mt-4">State</Label>
                <Input 
                  id="state" 
                  value={state} 
                  onChange={(e) => setState(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input 
                  id="zip_code" 
                  value={zipCode} 
                  onChange={(e) => setZipCode(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="hq-switch" 
                checked={isHeadquarters} 
                onCheckedChange={setIsHeadquarters} 
              />
              <Label htmlFor="hq-switch">Set as company headquarters</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdateBranch} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Branch Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Add a new branch to your company
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  required 
                />
                
                <Label htmlFor="state" className="mt-4">State</Label>
                <Input 
                  id="state" 
                  value={state} 
                  onChange={(e) => setState(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input 
                  id="zip_code" 
                  value={zipCode} 
                  onChange={(e) => setZipCode(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="hq-switch" 
                checked={isHeadquarters} 
                onCheckedChange={setIsHeadquarters} 
              />
              <Label htmlFor="hq-switch">Set as company headquarters</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreating(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateBranch} disabled={loading}>
              {loading ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={(open) => !open && setIsDeleting(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the branch "{selectedBranch?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBranch} disabled={loading}>
              {loading ? "Deleting..." : "Delete Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
