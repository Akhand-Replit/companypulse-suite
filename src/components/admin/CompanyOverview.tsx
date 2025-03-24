
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Company } from "@/types/userTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface CompanyOverviewProps {
  user: UserProfile;
  company: Company | null;
}

export default function CompanyOverview({ user, company }: CompanyOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(company?.name || "");
  const [description, setDescription] = useState(company?.description || "");
  const [subscriptionType, setSubscriptionType] = useState(company?.subscription_type || "basic");
  const [branchesLimit, setBranchesLimit] = useState(company?.branches_limit || 1);
  const [employeesLimit, setEmployeesLimit] = useState(company?.employees_limit || 10);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!company) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("companies")
        .update({
          name,
          description,
          subscription_type: subscriptionType,
          branches_limit: branchesLimit,
          employees_limit: employeesLimit,
          updated_at: new Date().toISOString()
        })
        .eq("id", company.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!company) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">No company data available</h3>
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{isEditing ? "Edit Company Information" : "Company Information"}</CardTitle>
            <CardDescription>
              {isEditing ? "Update your company details" : "View and manage your company details"}
            </CardDescription>
          </div>
          
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-description">Description</Label>
              <Textarea
                id="company-description"
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subscription-type">Subscription Type</Label>
                <Select value={subscriptionType} onValueChange={setSubscriptionType}>
                  <SelectTrigger id="subscription-type">
                    <SelectValue placeholder="Select subscription type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="branches-limit">Branches Limit</Label>
                <Input
                  id="branches-limit"
                  type="number"
                  min="1"
                  value={branchesLimit}
                  onChange={(e) => setBranchesLimit(parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employees-limit">Employees Limit</Label>
                <Input
                  id="employees-limit"
                  type="number"
                  min="1"
                  value={employeesLimit}
                  onChange={(e) => setEmployeesLimit(parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Company Name</h3>
                <p>{company.name}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Subscription</h3>
                <p className="capitalize">{company.subscription_type}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Status</h3>
                <p>{company.active ? "Active" : "Inactive"}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Branches Limit</h3>
                <p>{company.branches_limit}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Employees Limit</h3>
                <p>{company.employees_limit}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Created On</h3>
                <p>{formatDate(company.created_at)}</p>
              </div>
            </div>
            
            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">
                {company.description || "No description available."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
