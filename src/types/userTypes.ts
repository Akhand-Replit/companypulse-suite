
export type UserRole = 'admin' | 'company_admin' | 'manager' | 'assistant_manager' | 'employee' | 'job_seeker';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  company_id?: string;
  branch_id?: string;
  company_name?: string;
  branch_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  description: string | null;
  subscription_type: string;
  branches_limit: number;
  employees_limit: number;
  active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  company_id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  is_headquarters: boolean;
  created_at: string;
}
