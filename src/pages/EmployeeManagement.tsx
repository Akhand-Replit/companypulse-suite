
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeading } from "@/components/ui/section-heading";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { UserProfile, UserRole, Company, Branch } from "@/types/userTypes";
import { PlusCircle, Edit, Trash2, User } from "lucide-react";

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [companyId, setCompanyId] = useState("");
  const [branchId, setBranchId] = useState("");

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
          fetchEmployees();
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

  // Update filtered branches when company selection changes
  useEffect(() => {
    if (companyId) {
      setFilteredBranches(branches.filter(branch => branch.company_id === companyId));
    } else {
      setFilteredBranches([]);
    }
    setBranchId("");
  }, [companyId, branches]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Get all users from auth.users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      // Combine data
      let combinedEmployees: UserProfile[] = [];
      
      if (profiles) {
        combinedEmployees = profiles.map(profile => {
          const userRole = userRoles?.find(role => role.user_id === profile.id);
          
          return {
            id: profile.id,
            email: profile.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            role: userRole?.role as UserRole || 'employee',
            company_id: userRole?.company_id || '',
            branch_id: userRole?.branch_id || '',
            created_at: profile.created_at
          };
        });
      }
      
      setEmployees(combinedEmployees);
    } catch (error: any) {
      toast({
        title: "Error loading employees",
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

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');
        
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
    }
  };

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("employee");
    setCompanyId("");
    setBranchId("");
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName || !lastName || !role || !companyId || !branchId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email,
            first_name: firstName,
            last_name: lastName,
          })
          .eq('id', editingId);
          
        if (profileError) throw profileError;
        
        // Update role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({
            role: role as UserRole,
            company_id: companyId,
            branch_id: branchId,
          })
          .eq('user_id', editingId);
          
        if (roleError) throw roleError;
        
        toast({
          title: "Employee updated",
          description: `${firstName} ${lastName} has been updated successfully`,
        });
      } else {
        // Create new employee - first check if email exists
        const { data: existingUser, error: checkError } = await supabase
          .auth.admin.getUserByEmail(email);
          
        if (checkError) {
          // User doesn't exist, create new user
          const { data: userData, error: createError } = await supabase.auth.signUp({
            email,
            password: "tempPassword123", // This should be randomly generated or provided by the admin
            options: {
              data: {
                first_name: firstName,
                last_name: lastName,
              }
            }
          });
          
          if (createError) throw createError;
          
          if (userData.user) {
            // Add user role
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert([{
                user_id: userData.user.id,
                role: role as UserRole,
                company_id: companyId,
                branch_id: branchId
              }]);
              
            if (roleError) throw roleError;
            
            toast({
              title: "Employee created",
              description: `${firstName} ${lastName} has been created successfully`,
            });
          }
        } else if (existingUser) {
          // User exists, update role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: existingUser.id,
              role: role as UserRole,
              company_id: companyId,
              branch_id: branchId
            }]);
            
          if (roleError) throw roleError;
          
          toast({
            title: "Employee assigned",
            description: `${firstName} ${lastName} has been assigned successfully`,
          });
        }
      }
      
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error saving employee",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: UserProfile) => {
    setEmail(employee.email || "");
    setFirstName(employee.first_name || "");
    setLastName(employee.last_name || "");
    setRole(employee.role || "employee");
    setCompanyId(employee.company_id || "");
    setBranchId(employee.branch_id || "");
    setEditingId(employee.id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the system?`)) return;
    
    try {
      setLoading(true);
      
      // Remove role first
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);
        
      if (roleError) throw roleError;
      
      toast({
        title: "Employee removed",
        description: `${name} has been removed successfully`,
      });
      
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error removing employee",
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

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : "Unknown Branch";
  };

  if (loading && employees.length === 0) {
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
          title="Employee Management"
          subtitle="Manage your organization's employees"
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
                Add New Employee
              </>
            )}
          </Button>
        </div>

        {formOpen && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Employee" : "Add New Employee"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">First Name *</label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="First name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">Last Name *</label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email *</label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Email address"
                    disabled={!!editingId}
                  />
                  {editingId && (
                    <p className="text-xs text-muted-foreground">Email cannot be changed after creation</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Role *</label>
                    <Select 
                      value={role} 
                      onValueChange={(value) => setRole(value as UserRole)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="company_admin">Company Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Company *</label>
                    <Select 
                      value={companyId} 
                      onValueChange={setCompanyId}
                      required
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
                  
                  <div className="space-y-2">
                    <label htmlFor="branch" className="text-sm font-medium">Branch *</label>
                    <Select 
                      value={branchId} 
                      onValueChange={setBranchId}
                      required
                      disabled={!companyId || filteredBranches.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !companyId 
                            ? "Select company first" 
                            : filteredBranches.length === 0 
                              ? "No branches available" 
                              : "Select branch"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingId ? "Update Employee" : "Add Employee"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No employees found. Add your first employee to get started.
            </div>
          ) : (
            employees.map((employee) => (
              <Card key={employee.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {employee.first_name} {employee.last_name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(employee)}
                        title="Edit employee"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(employee.id, `${employee.first_name} ${employee.last_name}`)}
                        title="Remove employee"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm mb-4">
                    <p className="text-muted-foreground">{employee.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Role:</span>
                      <span className="ml-2 font-medium capitalize">{employee.role || "Not assigned"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company:</span>
                      <span className="ml-2 font-medium">
                        {employee.company_id ? getCompanyName(employee.company_id) : "Not assigned"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Branch:</span>
                      <span className="ml-2 font-medium">
                        {employee.branch_id ? getBranchName(employee.branch_id) : "Not assigned"}
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

export default EmployeeManagement;
