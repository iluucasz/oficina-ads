export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  cnpj?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  phone?: string;
  role: string;
  subscriptionPlan: string;
  termsAccepted: boolean;
  createdAt: string;
  lastLogin?: string;
  avatarUrl?: string;
} 