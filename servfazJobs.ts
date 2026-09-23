import { Job } from '../types';

export interface ServfazJobRaw {
  cargo: string;
  area: string;
  requisitos: string[];
  remuneracao_beneficios: string[];
  modalidade: 'Presencial' | 'Híbrido' | 'Remoto';
  contrato: 'CLT' | 'Estágio' | 'PJ' | 'Freelance';
  nivel: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Sem Experiência';
  link_candidatura_talentbrand: string;
  data_publicacao: string;
  isPcdExclusive?: boolean;
}

/**
 * Vagas oficiais da Servfaz obtidas diretamente do Portal Oficial Talentbrand
 * Link Base: https://app.talentbrand.com.br/c/servfaz
 */
export const SERVFAZ_RAW_JOBS: ServfazJobRaw[] = [
  {
    cargo: 'Auxiliar de Lavanderia - Intermitente',
    area: 'Operacional / Facilities Têxtil',
    requisitos: [
      'Ensino Fundamental ou Médio completo',
      'Experiência prévia em rotinas de lavanderia comercial, hospitalar ou hoteleira',
      'Conhecimento em separação de enxoval, pesagem, operação de máquinas industriais e dobradura',
      'Disponibilidade para atuar na modalidade intermitente por escala de atendimento'
    ],
    remuneracao_beneficios: [
      'Salário hora/dia proporcional CLT (Piso da Categoria)',
      'Adicional de insalubridade conforme laudo técnico',
      'Vale Transporte proporcional aos dias trabalhados',
      'Refeição no local de atendimento',
      'Seguro de Vida em grupo'
    ],
    modalidade: 'Presencial',
    contrato: 'Freelance',
    nivel: 'Sem Experiência',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-auxiliar-de-lavanderia-intermitente-teresina-pi-7f1a',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Copeira / Atendente de Nutrição Hospitalar',
    area: 'Nutrição e Copa / Facilities',
    requisitos: [
      'Ensino Médio completo',
      'Experiência comprovada em serviços de copa em clínicas, hospitais ou ambientes corporativos',
      'Curso de Boas Práticas de Manipulação de Alimentos e Higienização',
      'Postura ética, cordialidade, discrição e agilidade no atendimento'
    ],
    remuneracao_beneficios: [
      'Salário Base CLT (Piso da Categoria)',
      'Vale Alimentação (R$ 600,00)',
      'Vale Transporte',
      'Plano Odontológico',
      'Treinamento e capacitação contínua pelo programa Servfaz Educa'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Júnior',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-copeira-teresina-pi-4b2c',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Auxiliar de Serviços Gerais (ASG) - Limpeza & Conservação',
    area: 'Serviços Gerais / Facilities',
    requisitos: [
      'Ensino Fundamental ou Médio',
      'Experiência em limpeza corporativa, predial ou hospitalar',
      'Manuseio seguro de produtos químicos, mop, enceradeiras e desinfecção de ambientes',
      'Disponibilidade de horário (Escala 6x1 ou 12x36). Vaga aberta para PCDs.'
    ],
    remuneracao_beneficios: [
      'Salário Categoria CLT (R$ 1.540,00)',
      'Adicional de Insalubridade (quando aplicável)',
      'Vale Alimentação / Refeição',
      'Vale Transporte',
      'Seguro de Vida e Assistência Odontológica'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sem Experiência',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-auxiliar-de-servicos-gerais-teresina-pi-2e9d',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Operador de Microcomputador / Apoio Administrativo',
    area: 'Administrativo / Atendimento',
    requisitos: [
      'Ensino Médio completo ou Superior cursando em Administração/Tecnologia',
      'Boa digitação e domínio do Pacote Office (Word, Excel, Outlook)',
      'Experiência em conferência de documentos, atendimento a chamados e alimentação de planilhas',
      'Organização, pontualidade e proatividade. Vaga inclusiva para PCD.'
    ],
    remuneracao_beneficios: [
      'R$ 1.850,00 (CLT)',
      'Vale Refeição / Alimentação',
      'Vale Transporte',
      'Plano Odontológico',
      'Oportunidade de crescimento no plano de cargos da Servfaz'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Júnior',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-operador-de-microcomputador-teresina-pi-1a4f',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Analista de Compras e Suprimentos',
    area: 'Suprimentos / Compras Corporativas',
    requisitos: [
      'Superior completo em Administração, Ciências Contábeis, Engenharia de Produção ou Logística',
      'Experiência sólida em cotações, negociação com grandes fornecedores, compras de insumos de limpeza/EPIs',
      'Conhecimento de tributação (ICMS, ST, DIFAL) e conferência de Notas Fiscais',
      'Domínio avançado em Excel e sistemas integrados ERP. Vaga aberta para PCD.'
    ],
    remuneracao_beneficios: [
      'R$ 2.800,00 a R$ 3.500,00 (CLT)',
      'Vale Alimentação / Refeição',
      'Vale Transporte',
      'Plano Odontológico',
      'Seguro de Vida em Grupo'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Pleno',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-analista-de-compras-teresina-pi-5c8e',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Analista de Licitação Jr',
    area: 'Jurídico / Licitações e Contratos',
    requisitos: [
      'Superior em Direito, Ciências Contábeis ou Administração',
      'Experiência na leitura minuciosa de editais públicos (Lei 14.133/21 e Lei 8.666)',
      'Elaboração de propostas comerciais, planilha de custos e formação de preços para terceirização',
      'Condução de pregões eletrônicos (ComprasGov, Licitações-e). Vaga aberta para PCD.'
    ],
    remuneracao_beneficios: [
      'R$ 2.500,00 a R$ 3.200,00 (CLT)',
      'Vale Refeição',
      'Vale Transporte',
      'Plano Odontológico',
      'Parceria com instituições de ensino'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Júnior',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-analista-de-licitacao-jr-teresina-pi-6d3a',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Gerente de Serviços / Facilities',
    area: 'Gestão e Operações / Liderança',
    requisitos: [
      'Graduação em Administração, Engenharia de Produção ou áreas correlatas',
      'Experiência comprovada na liderança e gestão de contratos de facilities de grande porte',
      'Supervisão de equipes operacionais, controle de turnover, absenteísmo e distribuição de insumos/EPIs',
      'CNH B ativa e disponibilidade para visitas técnicas a postos de serviços'
    ],
    remuneracao_beneficios: [
      'R$ 4.500,00 a R$ 6.000,00 (CLT) + Bônus por metas operacionais',
      'Vale Refeição / Alimentação',
      'Veículo corporativo ou auxílio combustível',
      'Plano de Saúde e Odontológico',
      'Seguro de Vida'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sênior',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-gerente-de-servicos-facilities-teresina-pi-9b0f',
    data_publicacao: '17/09/2026'
  },
  {
    cargo: 'Jardineiro e Tratador de Áreas Verdes',
    area: 'Operacional / Manutenção Externa',
    requisitos: [
      'Ensino Fundamental completo',
      'Experiência em corte de grama com roçadeira a gasolina, poda, adubação e plantio',
      'Zelo por equipamentos de jardinagem e cumprimento rigoroso das normas de segurança com EPIs',
      'Disponibilidade para atuar em Teresina - PI'
    ],
    remuneracao_beneficios: [
      'R$ 1.620,00 (CLT) + Adicional de Insalubridade',
      'Vale Transporte',
      'Vale Alimentação (R$ 550,00)',
      'Seguro de Vida e Assistência Odontológica'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sem Experiência',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-jardineiro-teresina-pi-8a0b',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Encarregado(a) de Turma / Líder Operacional',
    area: 'Supervisão / Operações de Limpeza',
    requisitos: [
      'Ensino Médio completo',
      'Experiência na coordenação de equipes de higienização, portaria ou copa',
      'Controle de escala de funcionários, conferência de materiais e preenchimento de relatórios diários',
      'Boa comunicação interpessoal e liderança'
    ],
    remuneracao_beneficios: [
      'R$ 2.200,00 (CLT) + Gratificação de Função',
      'Vale Refeição',
      'Vale Transporte',
      'Plano Odontológico'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Pleno',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-encarregado-de-turma-teresina-pi-3c0b',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Banco de Talentos Servfaz (Piauí & Maranhão)',
    area: 'Banco de Talentos / Diversas Áreas',
    requisitos: [
      'Vagas abertas para cadastro contínuo no Banco de Talentos oficial da Servfaz',
      'Oportunidades em Facilities, Limpeza, Portaria, Administrativo, Manutenção Predial e Tecnologia',
      'Válido para profissionais com e sem experiência e Pessoas com Deficiência (PCD)'
    ],
    remuneracao_beneficios: [
      'Remuneração compatível com a função a ser preenchida',
      'Pacote completo de benefícios Servfaz (CLT)',
      'Acesso prioritário a novas vagas abertas na sua região'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sem Experiência',
    link_candidatura_talentbrand: 'https://app.talentbrand.com.br/jobs/servfaz-banco-de-talentos-piaui-maranhao-0f8e',
    data_publicacao: '18/09/2026'
  }
];

export const SERVFAZ_CONVERTED_JOBS: Job[] = SERVFAZ_RAW_JOBS.map((s, idx) => {
  const companyColor = 'from-emerald-800 via-teal-800 to-slate-900';

  const tags = [
    'Servfaz Talentbrand',
    'Talentbrand Oficial',
    'Teresina',
    'Facilities',
    s.area.split('/')[0].trim(),
    s.modalidade,
    s.contrato,
    ...(s.isPcdExclusive ? ['Exclusivo PCD'] : ['Vaga Inclusiva PCD'])
  ];

  return {
    id: `servfaz-talentbrand-${idx + 1}-${s.cargo.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    title: s.cargo,
    company: 'Servfaz',
    companyInitials: 'SF',
    companyColor: companyColor,
    location: 'Teresina - PI',
    workMode: s.modalidade,
    contractType: s.contrato,
    experienceLevel: s.nivel,
    category: s.area.split('/')[0].trim(),
    salary: s.remuneracao_beneficios[0] || 'Compatível com o mercado + Benefícios',
    description: `Oportunidade oficial da Servfaz via Portal Talentbrand: ${s.cargo} em Teresina - PI. Área: ${s.area}. Candidatura direta e 100% gratuita através do link oficial no Talentbrand.`,
    requirements: s.requisitos,
    benefits: s.remuneracao_beneficios,
    tags: Array.from(new Set(tags)),
    postedAt: `Talentbrand • Publicada em ${s.data_publicacao}`,
    timestamp: Date.now() - idx * 1000 * 60 * 10,
    applicationUrl: s.link_candidatura_talentbrand,
    contactEmail: 'recrutamento@servfaz.com.br',
    isNew: true,
    isFeatured: idx < 3,
    viewsCount: Math.floor(80 + Math.random() * 110),
    source: 'Talentbrand',
    sourceUrl: s.link_candidatura_talentbrand
  };
});
