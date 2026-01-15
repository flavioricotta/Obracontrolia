
export enum PaymentStatus {
  PAID = 'Pago',
  PENDING = 'Pendente',
  SCHEDULED = 'Agendado'
}

export enum ExpenseType {
  MATERIAL = 'Material',
  LABOR = 'Mão de Obra',
  SERVICE = 'Serviço',
  TAXES = 'Impostos',
  OTHER = 'Outros'
}

export interface Project {
  id?: number;
  name: string;
  address: string;
  startDate: string; // ISO Date
  endDate?: string; // ISO Date
  budget: number;
  sqMeters: number;
  type: string;
  notes?: string;
  createdAt: string;
  completedStages?: number[];
  currentStage?: string;
}

export interface Category {
  id?: number;
  name: string;
  type: ExpenseType;
  isFixed?: boolean;
}

export interface Expense {
  id?: number;
  projectId: number;
  date: string; // ISO Date
  categoryId: number;
  subCategory?: string;
  supplier: string;
  responsible: string;
  paymentMethod: string;
  status: PaymentStatus;
  dueDate?: string;
  amountExpected: number;
  amountPaid: number;
  description: string;
  quantity?: number;
  unit?: string;
  receiptImages?: string[]; // Changed to array of Base64 strings
  createdAt: string;
}

export interface Task {
  id?: number;
  projectId: number;
  title: string;
  isDone: boolean;
  createdAt: string;
}

export interface Product {
  id?: number;
  storeId: string; // Identifies which store owns this product
  name: string;
  description?: string;
  price: number;
  unit: string;
  category: string;
  lastUpdated: string;
}

export interface DashboardStats {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentageUsed: number;
  costPerSqMeter: number;
}

export interface Store {
  id?: number;
  userId?: string;
  name: string;
  cnpj?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  // Enhanced fields
  description?: string;
  openingHours?: string;
  deliveryOptions?: string[];
  paymentMethods?: string[];
  instagram?: string;
  facebook?: string;
}