
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeading } from "@/components/ui/section-heading";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Building, PlusCircle, Edit, Trash2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  description: string | null;
  subscription_type: string;
  branches_limit: number;
  employees_limit: number;
  active: boolean;
  created_at: string;
}

const CompanyManagement = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("demo");
  const [branchesLimit, setBranchesLimit] = useState(1);
  const [employeesLimit, setEmployeesLimit] = useState(10);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to access this page",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Check if user is admin
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();

        if (data) {
          setIsAdmin(true);
          fetchCompanies();
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      
      if (data) {
        setCompanies(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading companies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSubscriptionType("demo");
    setBranchesLimit(1);
    setEmployeesLimit(10);
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const companyData = {
        name,
        description,
        subscription_type: subscriptionType,
        branches_limit: branchesLimit,
        employees_limit: employeesLimit,
        active: true
      };
      
      if (editingId) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', editingId);
          
        if (error) throw error;
        
        toast({
          title: "Company updated",
          description: `${name} has been updated successfully`,
        });
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert([companyData]);
          
        if (error) throw error;
        
        toast({
          title: "Company created",
          description: `${name} has been created successfully`,
        });
      }
      
      resetForm();
      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Error saving company",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setName(company.name);
    setDescription(company.description || "");
    setSubscriptionType(company.subscription_type);
    setBranchesLimit(company.branches_limit);
    setEmployeesLimit(company.employees_limit);
    setEditingId(company.id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Company deleted",
        description: `${name} has been deleted successfully`,
      });
      
      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Error deleting company",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <SectionHeading
          title="Company Management"
          subtitle="Create and manage your companies"
          className="mb-8"
        />

        <div className="flex justify-end mb-6">
          <Button 
            onClick={() => setFormOpen(!formOpen)} 
            className="flex items-center gap-2"
          >
            {formOpen ? "Cancel" : (
              <>
                <PlusCircle size={18} />
                Add New Company
              </>
            )}
          </Button>
        </div>

        {formOpen && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Company" : "Create New Company"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Company Name *</label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter company description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="subscription" className="text-sm font-medium">Subscription Type *</label>
                    <Select 
                      value={subscriptionType} 
                      onValueChange={setSubscriptionType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subscription type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="branchesLimit" className="text-sm font-medium">Branches Limit *</label>
                    <Input
                      id="branchesLimit"
                      type="number"
                      min="1"
                      value={branchesLimit}
                      onChange={(e) => setBranchesLimit(parseInt(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="employeesLimit" className="text-sm font-medium">Employees Limit *</label>
                    <Input
                      id="employeesLimit"
                      type="number"
                      min="1"
                      value={employeesLimit}
                      onChange={(e) => setEmployeesLimit(parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingId ? "Update Company" : "Create Company"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No companies found. Create your first company to get started.
            </div>
          ) : (
            companies.map((company) => (
              <Card key={company.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">{company.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(company)}
                        title="Edit company"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(company.id, company.name)}
                        title="Delete company"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {company.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {company.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Subscription:</span>
                      <span className="ml-2 font-medium capitalize">{company.subscription_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Branches:</span>
                      <span className="ml-2 font-medium">{company.branches_limit}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Employees:</span>
                      <span className="ml-2 font-medium">{company.employees_limit}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 font-medium ${company.active ? 'text-green-600' : 'text-red-600'}`}>
                        {company.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CompanyManagement;
