
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
  updated_at: string;
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
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to: string | null;
  assigned_by: string;
  company_id: string;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
}

export interface DailyReport {
  id: string;
  user_id: string;
  company_id: string;
  branch_id: string | null;
  date: string;
  summary: string;
  hours_worked: number;
  tasks_completed: string[] | null;
  challenges: string | null;
  plans_for_tomorrow: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}
