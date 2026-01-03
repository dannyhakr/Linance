// Global type definitions

export interface Operator {
  id: number;
  username: string;
  created_at: string;
  last_login?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  pan?: string;
  aadhaar?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: number;
  customer_id: number;
  loan_number: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  repayment_frequency: 'monthly' | 'weekly' | 'daily';
  emi_date: number;
  product_type?: string;
  status: 'active' | 'overdue' | 'closed' | 'default';
  outstanding_principal: number;
  total_interest_earned: number;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanSchedule {
  id: number;
  loan_id: number;
  installment_number: number;
  due_date: string;
  principal_component: number;
  interest_component: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'skipped';
  paid_date?: string;
  paid_amount: number;
}

export interface Payment {
  id: number;
  loan_id: number;
  schedule_id?: number;
  amount: number;
  payment_date: string;
  payment_mode: 'cash' | 'upi' | 'bank' | 'cheque';
  reference_number?: string;
  notes?: string;
  receipt_generated: boolean;
  receipt_path?: string;
  created_at: string;
}

export interface Collateral {
  id: number;
  loan_id?: number;
  asset_type: 'vehicle' | 'gold' | 'property' | 'other';
  description?: string;
  serial_number?: string;
  registration_number?: string;
  original_value: number;
  current_value: number;
  owner_name?: string;
  valuation_date: string;
  at_risk: boolean;
  risk_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface CollateralValuation {
  id: number;
  collateral_id: number;
  valuation_date: string;
  value: number;
  valuator?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardData {
  totalActiveLoans: number;
  totalOutstandingPrincipal: number;
  overdueLoansCount: number;
  paymentsDueToday: number;
  paymentsDueThisWeek: number;
  atRiskCollaterals: number;
  upcomingDues: Array<{
    customer_name: string;
    loan_number: string;
    due_amount: number;
    due_date: string;
  }>;
  recentPayments: Array<{
    id: number;
    amount: number;
    loan_number: string;
    customer_name: string;
    payment_mode: string;
    payment_date: string;
  }>;
  lastBackupTime?: string;
  pendingNotifications: number;
}

