
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
import { UserCog, PlusCircle, Edit, Trash2, Search } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  company_id: string;
}

interface Employee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id: string;
  branch_id: string | null;
  company_name: string;
  branch_name: string | null;
}

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [companyId, setCompanyId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);

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
          fetchData();
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

  useEffect(() => {
    if (companyId) {
      const filtered = branches.filter(branch => branch.company_id === companyId);
      setFilteredBranches(filtered);
      if (filtered.length > 0 && !filtered.some(b => b.id === branchId)) {
        setBranchId(filtered[0].id);
      }
    } else {
      setFilteredBranches([]);
      setBranchId("");
    }
  }, [companyId, branches]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name, company_id')
        .order('name');

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

      // Fetch employees with their roles and company/branch info
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select(`
          id, 
          email, 
          first_name, 
          last_name,
          user_roles!inner (
            role,
            company_id,
            branch_id,
            companies:company_id (name),
            branches:branch_id (name)
          )
        `)
        .order('first_name');

      if (employeesError) throw employeesError;
      
      if (employeesData) {
        const formattedEmployees = employeesData.map(emp => ({
          id: emp.id,
          email: emp.email || '',
          first_name: emp.first_name || '',
          last_name: emp.last_name || '',
          role: emp.user_roles.role || '',
          company_id: emp.user_roles.company_id || '',
          branch_id: emp.user_roles.branch_id || null,
          company_name: emp.user_roles.companies?.name || '',
          branch_name: emp.user_roles.branches?.name || null
        }));
        
        setEmployees(formattedEmployees);
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setRole("employee");
    setCompanyId("");
    setBranchId("");
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      toast({
        title: "Missing company",
        description: "Please select a company for this employee",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing employee
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            email: email
          })
          .eq('id', editingId);
        
        if (profileError) throw profileError;
        
        // Update role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({
            role,
            company_id: companyId,
            branch_id: branchId || null
          })
          .eq('user_id', editingId)
          .eq('role', role); // Target the specific role entry
        
        if (roleError) throw roleError;
        
        toast({
          title: "Employee updated",
          description: `${firstName} ${lastName} has been updated successfully`,
        });
      } else {
        // Create new employee via signup
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName
            }
          }
        });
        
        if (signupError) throw signupError;
        
        if (signupData?.user) {
          // Add role for the new user
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: signupData.user.id,
              role,
              company_id: companyId,
              branch_id: branchId || null
            }]);
          
          if (roleError) throw roleError;
          
          toast({
            title: "Employee created",
            description: `${firstName} ${lastName} has been added successfully`,
          });
        }
      }
      
      resetForm();
      fetchData();
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

  const handleEdit = (employee: Employee) => {
    setEmail(employee.email);
    setFirstName(employee.first_name);
    setLastName(employee.last_name);
    setRole(employee.role);
    setCompanyId(employee.company_id);
    setBranchId(employee.branch_id || "");
    setEditingId(employee.id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will permanently remove their account.`)) return;
    
    try {
      setLoading(true);
      
      // Delete user from auth (cascades to profiles via foreign key)
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) throw error;
      
      toast({
        title: "Employee deleted",
        description: `${name} has been deleted successfully`,
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.branch_name && emp.branch_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          subtitle="Manage your employees and their roles"
          className="mb-8"
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={() => setFormOpen(!formOpen)} 
            className="flex items-center gap-2 w-full sm:w-auto"
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
                      placeholder="Enter first name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">Last Name *</label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Enter last name"
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
                    placeholder="Enter email address"
                    disabled={!!editingId} // Cannot change email for existing employees
                  />
                </div>
                
                {!editingId && (
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Password *</label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!editingId}
                      placeholder="Enter password"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Role *</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company_admin">Company Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Company *</label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="branch" className="text-sm font-medium">Branch</label>
                    <Select 
                      value={branchId} 
                      onValueChange={setBranchId}
                      disabled={!companyId || filteredBranches.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBranches.map(branch => (
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

        {employees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No employees found. Add your first employee to get started.
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No employees match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <UserCog className="h-5 w-5 text-primary" />
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
                        title="Delete employee"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{employee.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Role:</span>
                      <span className="ml-2 capitalize">{employee.role.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company:</span>
                      <span className="ml-2">{employee.company_name}</span>
                    </div>
                    {employee.branch_name && (
                      <div>
                        <span className="text-muted-foreground">Branch:</span>
                        <span className="ml-2">{employee.branch_name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default EmployeeManagement;
