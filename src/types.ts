export type WorkMode = 'Remoto' | 'Híbrido' | 'Presencial' | 'Todos';
export type ContractType = 'CLT' | 'PJ' | 'Estágio' | 'Freelance' | 'Todos';
export type ExperienceLevel = 'Todos' | 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Sem Experiência';
export type JobSource = 'Todos' | 'Talentbrand' | 'Gupy' | 'LinkedIn' | 'Direto' | 'Themos Vagas' | 'SINE-PI';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  location: string;
  workMode: 'Remoto' | 'Híbrido' | 'Presencial' | string;
  contractType: 'CLT' | 'PJ' | 'Estágio' | 'Freelance' | string;
  experienceLevel: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Sem Experiência' | string;
  category: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  tags: string[];
  postedAt: string; // Real publication date formatted or message
  timestamp: number; // Real epoch timestamp from publishedDate, or 0
  publishedDate?: string; // Original ISO string from source
  updatedAt?: number; // Real source update timestamp if provided
  education?: string;
  applicationUrl: string;
  contactEmail?: string;
  whatsapp?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  viewsCount: number;
  source: 'Talentbrand' | 'Gupy' | 'LinkedIn' | 'Direto' | 'Themos Vagas' | 'SINE-PI';
  sourceUrl?: string;
  pcdOnly?: boolean;
}

export interface GratitudeComment {
  id: string;
  authorName: string;
  authorRole: string;
  companyFound: string;
  testimony: string;
  avatarEmoji: string;
  avatarBg: string;
  reactions: {
    celebration: number;
    love: number;
    clap: number;
  };
  date: string;
  timestamp: number;
  tips?: string;
}

export interface FilterState {
  query: string;
  location: string;
  workMode: WorkMode;
  contractType: ContractType;
  category: string;
  experienceLevel: ExperienceLevel;
  source: JobSource;
  onlyNew: boolean;
  last3DaysOnly?: boolean;
  onlyWithEmail?: boolean;
  onlyWithLink?: boolean;
  sortBy: 'recent' | 'salary' | 'views';
}
