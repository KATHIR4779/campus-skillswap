export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  major?: string;
  year?: string;
  university?: string;
  timeBalance: number;
  role: 'STUDENT' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  };
  _count?: {
    sessions: number;
    reviews: number;
  };
}

export interface Session {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  skill: {
    id: string;
    title: string;
    category: string;
    price: number;
  };
  instructor: {
    id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  };
  student: {
    id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  };
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'EARNED' | 'SPENT' | 'REFUND';
  description?: string;
  createdAt: string;
  session?: {
    skill: {
      title: string;
    };
  };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    username: string;
    fullName: string;
  };
  reviewee: {
    username: string;
    fullName: string;
  };
  skill?: {
    title: string;
  };
  session?: {
    id: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  bio?: string;
  major?: string;
  year?: string;
  university?: string;
}

export interface CreateSkillData {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  price: number;
}

export interface CreateSessionData {
  skillId: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  location?: string;
}

export interface DashboardStats {
  totalSkills: number;
  activeSkills: number;
  totalSessions: number;
  completedSessions: number;
  totalEarnings: {
    _sum: {
      amount: number | null;
    };
  };
  totalSpent: {
    _sum: {
      amount: number | null;
    };
  };
}
