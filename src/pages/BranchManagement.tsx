
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeading } from "@/components/ui/section-heading";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Company, Branch } from "@/types/userTypes";
import { PlusCircle, Edit, Trash2, Building2 } from "lucide-react";

const BranchManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const companyIdParam = queryParams.get('companyId');
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(companyIdParam || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isHeadquarters, setIsHeadquarters] = useState(false);

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
          fetchBranches();
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

  const fetchBranches = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('branches').select('*');
      
      // If company ID is provided, filter by it
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('name');
        
      if (error) throw error;
      
      if (data) {
        setBranches(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading branches",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
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
    }
  };

  const resetForm = () => {
    setName("");
    setCompanyId(companyIdParam || "");
    setAddress("");
    setCity("");
    setState("");
    setCountry("");
    setZipCode("");
    setPhone("");
    setEmail("");
    setIsHeadquarters(false);
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !companyId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const branchData = {
        name,
        company_id: companyId,
        address,
        city,
        state,
        country,
        zip_code: zipCode,
        phone,
        email,
        is_headquarters: isHeadquarters
      };
      
      if (editingId) {
        // Update existing branch
        const { error } = await supabase
          .from('branches')
          .update(branchData)
          .eq('id', editingId);
          
        if (error) throw error;
        
        toast({
          title: "Branch updated",
          description: `${name} has been updated successfully`,
        });
      } else {
        // Create new branch
        const { error } = await supabase
          .from('branches')
          .insert([branchData]);
          
        if (error) throw error;
        
        toast({
          title: "Branch created",
          description: `${name} has been created successfully`,
        });
      }
      
      resetForm();
      fetchBranches();
    } catch (error: any) {
      toast({
        title: "Error saving branch",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setName(branch.name);
    setCompanyId(branch.company_id);
    setAddress(branch.address || "");
    setCity(branch.city || "");
    setState(branch.state || "");
    setCountry(branch.country || "");
    setZipCode(branch.zip_code || "");
    setPhone(branch.phone || "");
    setEmail(branch.email || "");
    setIsHeadquarters(branch.is_headquarters);
    setEditingId(branch.id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Branch deleted",
        description: `${name} has been deleted successfully`,
      });
      
      fetchBranches();
    } catch (error: any) {
      toast({
        title: "Error deleting branch",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : "Unknown Company";
  };

  if (loading && branches.length === 0) {
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
          title="Branch Management"
          subtitle={companyId ? `Manage branches for ${getCompanyName(companyId)}` : "Manage all branches"}
          className="mb-8"
        />

        <div className="flex justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/company')}
          >
            Back to Companies
          </Button>
          
          <Button 
            onClick={() => setFormOpen(!formOpen)} 
            className="flex items-center gap-2"
          >
            {formOpen ? "Cancel" : (
              <>
                <PlusCircle size={18} />
                Add New Branch
              </>
            )}
          </Button>
        </div>

        {formOpen && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Branch" : "Create New Branch"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Branch Name *</label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Enter branch name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Company *</label>
                    <Select 
                      value={companyId} 
                      onValueChange={setCompanyId}
                      required
                      disabled={!!companyIdParam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">Address</label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter branch address"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">City</label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="state" className="text-sm font-medium">State/Province</label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Enter state or province"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="country" className="text-sm font-medium">Country</label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="zipCode" className="text-sm font-medium">Zip/Postal Code</label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Enter zip code"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter contact email"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="headquarters" 
                    checked={isHeadquarters} 
                    onCheckedChange={setIsHeadquarters} 
                  />
                  <label htmlFor="headquarters" className="text-sm font-medium">
                    This is the company headquarters
                  </label>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingId ? "Update Branch" : "Create Branch"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No branches found. Create your first branch to get started.
            </div>
          ) : (
            branches.map((branch) => (
              <Card key={branch.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{branch.name}</h3>
                        <p className="text-sm text-muted-foreground">{getCompanyName(branch.company_id)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(branch)}
                        title="Edit branch"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(branch.id, branch.name)}
                        title="Delete branch"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {branch.address && (
                    <div className="mb-4 text-sm">
                      <p className="whitespace-pre-line">{branch.address}</p>
                      <p>
                        {[
                          branch.city, 
                          branch.state, 
                          branch.zip_code,
                          branch.country
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {branch.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2">{branch.phone}</span>
                      </div>
                    )}
                    
                    {branch.email && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{branch.email}</span>
                      </div>
                    )}
                    
                    {branch.is_headquarters && (
                      <div className="col-span-2 mt-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                          Headquarters
                        </span>
                      </div>
                    )}
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

export default BranchManagement;
