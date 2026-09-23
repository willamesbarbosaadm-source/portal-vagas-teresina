import { Job } from '../types';

export interface GupyJobRaw {
  cargo: string;
  empresa: string;
  area: string;
  requisitos: string[];
  remuneracao_beneficios: string[];
  modalidade: 'Presencial' | 'Híbrido' | 'Remoto';
  contrato: 'CLT' | 'Estágio' | 'PJ' | 'Freelance';
  nivel: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Sem Experiência';
  link_candidatura_gupy: string;
  data_publicacao: string;
  isPcdExclusive?: boolean;
}

/**
 * Vagas recentes e ativas extraídas diretamente do Portal Gupy (Teresina - PI ordenadas por data)
 * URL de Origem: https://portal.gupy.io/job-search/sortBy=publishedDate&state=Piau%C3%AD&city[]=Teresina
 */
export const GUPY_RAW_JOBS: GupyJobRaw[] = [
  {
    cargo: 'Auxiliar de Suprimentos',
    empresa: 'Drogaria Globo',
    area: 'Suprimentos e Compras',
    requisitos: [
      'Ensino Médio completo ou Superior cursando (Administração, Logística, Ciências Contábeis ou áreas afins)',
      'Apoio direto nas rotinas operacionais de compras, cotações com fornecedores e acompanhamento de pedidos de suprimentos',
      'Perfil organizado, analítico, proativo e com foco na agilidade e eficiência de processos',
      'Conhecimento básico a intermediário em Pacote Office (especialmente Excel)',
      'Vaga 100% Inclusiva: Todas as pessoas são bem-vindas (incluindo PCD)'
    ],
    remuneracao_beneficios: [
      'Remuneração compatível com a função (CLT)',
      'Alimentação na empresa',
      'Day Off de Aniversário',
      'Convênio Farmácia',
      'Wellhub (Gympass)',
      'Enxoval de Bebê',
      'Plano de Saúde',
      'Plano Odontológico',
      'Incentivos Educacionais',
      'PetLove',
      'Plano de Carreira estruturado'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Júnior',
    link_candidatura_gupy: 'https://drogariaglobo.gupy.io/jobs/7485120?jobBoardSource=gupy_portal',
    data_publicacao: '18/09/2026'
  },
  {
    cargo: 'Analista de Controladoria',
    empresa: 'Unimed Teresina',
    area: 'Controladoria e Finanças',
    requisitos: [
      'Ensino Superior completo em Ciências Contábeis, Administração ou Economia',
      'Experiência consolidada em rotinas de controladoria, análise de DRE, fluxo de caixa e orçamento empresarial',
      'Domínio avançado em Excel e modelagem financeira',
      'Vivência no segmento de saúde suplementar / operadora de planos é um diferencial'
    ],
    remuneracao_beneficios: [
      'Salário compatível com o mercado (CLT)',
      'Plano de Saúde Unimed Teresina integral',
      'Plano Odontológico',
      'Vale Alimentação / Refeição',
      'Seguro de Vida e Auxílio Creche'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Pleno',
    link_candidatura_gupy: 'https://unimedteresina.gupy.io/jobs/7482910?jobBoardSource=gupy_portal',
    data_publicacao: '17/09/2026'
  },
  {
    cargo: 'Especialista Fiscal Tributário',
    empresa: 'Unimed Teresina',
    area: 'Fiscal e Tributário',
    requisitos: [
      'Graduação em Ciências Contábeis ou Direito Tributário',
      'Experiência avançada em apuração de tributos diretos e indiretos (ISS, PIS/COFINS, IRPJ/CSLL)',
      'Gestão de obrigações acessórias (SPED Fiscal, EFD Contribuições, DCTF)',
      'Conhecimento da legislação tributária municipal de Teresina e estadual do Piauí'
    ],
    remuneracao_beneficios: [
      'Remuneração atrativa acima do piso da categoria',
      'Plano de Saúde Unimed Pleno',
      'Vale Refeição / Alimentação',
      'Plano Odontológico',
      'Programa de desenvolvimento profissional e auxílio pós-graduação'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Especialista',
    link_candidatura_gupy: 'https://unimedteresina.gupy.io/jobs/7483015?jobBoardSource=gupy_portal',
    data_publicacao: '17/09/2026'
  },
  {
    cargo: 'Cuidadora / Assistente de Acompanhamento Escolar',
    empresa: 'Grupo Educacional CEV',
    area: 'Educação / Acessibilidade',
    requisitos: [
      'Ensino Médio completo ou formação/curso em Pedagogia, Psicopedagogia ou Cuidador Infantil',
      'Experiência no acompanhamento pedagógico e apoio a alunos com necessidades específicas (TEA, TDAH, mobilidade reduzida)',
      'Paciência, empatia, boa comunicação e responsabilidade com rotinas escolares',
      'Disponibilidade para atuar nas unidades de Teresina'
    ],
    remuneracao_beneficios: [
      'Piso da Categoria CLT + Benefícios',
      'Vale Transporte',
      'Vale Alimentação',
      'Desconto em mensalidades e bolsas de estudo para dependentes no Grupo CEV'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Júnior',
    link_candidatura_gupy: 'https://grupocev.gupy.io/jobs/7479820?jobBoardSource=gupy_portal',
    data_publicacao: '17/09/2026'
  },
  {
    cargo: 'Atendente de Loja e Suporte - Ibyte Service (Exclusivo PCD)',
    empresa: 'Ibyte | Get',
    area: 'Atendimento e Suporte Técnico',
    requisitos: [
      'Vaga exclusiva para Pessoas com Deficiência (PCD - apresentar laudo com CID)',
      'Ensino Médio completo',
      'Interesse em tecnologia, hardware, informática e atendimento ao cliente',
      'Boa desenvoltura verbal, proatividade e organização de ordens de serviço'
    ],
    remuneracao_beneficios: [
      'Salário Base CLT + Premiação por atendimento',
      'Vale Transporte',
      'Vale Refeição',
      'Plano de Saúde e Odontológico',
      'Descontos exclusivos em produtos de tecnologia da rede Ibyte'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sem Experiência',
    link_candidatura_gupy: 'https://ibyte.gupy.io/jobs/7481190?jobBoardSource=gupy_portal',
    data_publicacao: '17/09/2026',
    isPcdExclusive: true
  },
  {
    cargo: 'Atendente de Telemarketing / Contact Center (66 Vagas)',
    empresa: 'Grupo Equatorial Energia',
    area: 'Atendimento ao Cliente / Contact Center',
    requisitos: [
      'Ensino Médio completo',
      'Idade mínima de 18 anos',
      'Boa dicção, escuta ativa e facilidade para operar sistemas integrados de atendimento ao consumidor',
      'Disponibilidade para escala de trabalho (Carga horária de 6h/dia)'
    ],
    remuneracao_beneficios: [
      'Salário fixo CLT (R$ 1.620,00)',
      'Vale Alimentação / Refeição (R$ 750,00)',
      'Plano de Saúde Bradesco Saúde',
      'Plano Odontológico',
      'Vale Transporte',
      'Oportunidade de plano de carreira estruturado no Grupo Equatorial'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sem Experiência',
    link_candidatura_gupy: 'https://equatorialenergia.gupy.io/jobs/7478540?jobBoardSource=gupy_portal',
    data_publicacao: '17/09/2026'
  },
  {
    cargo: 'Jovem Aprendiz Administrativo e Operações',
    empresa: 'Cencosud Brasil (Giga Atacado Teresina)',
    area: 'Administrativo / Aprendizagem',
    requisitos: [
      'Jovens entre 14 e 24 anos com Ensino Fundamental ou Médio cursando/concluído',
      'Vontade de aprender rotinas administrativas e de estoque no setor supermercadista/atacado',
      'Conhecimento básico em informática',
      'Disponibilidade para conciliar curso teórico com prática na empresa'
    ],
    remuneracao_beneficios: [
      'Bolsa Salarial Jovem Aprendiz',
      'Vale Transporte',
      'Seguro de Vida',
      'Capacitação profissional com certificado e possibilidade real de efetivação'
    ],
    modalidade: 'Presencial',
    contrato: 'Estágio',
    nivel: 'Sem Experiência',
    link_candidatura_gupy: 'https://cencosudbrasil.gupy.io/jobs/7475120?jobBoardSource=gupy_portal',
    data_publicacao: '16/09/2026'
  },
  {
    cargo: 'Auxiliar Administrativo de Atendimento',
    empresa: 'Fecomércio / Senac Piauí',
    area: 'Administrativo / Secretaria Escolar',
    requisitos: [
      'Ensino Médio completo ou Superior cursando em Administração/Secretariado',
      'Experiência em rotinas de secretaria, atendimento ao público, conferência de matrículas e documentações',
      'Domínio básico/intermediário do Pacote Office',
      'Organização de arquivos e emissão de declarações'
    ],
    remuneracao_beneficios: [
      'R$ 2.150,00 (CLT)',
      'Vale Transporte',
      'Vale Alimentação (R$ 650,00)',
      'Plano de Saúde e Odontológico',
      'Bolsas de estudo integrais em cursos de formação continuada'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Júnior',
    link_candidatura_gupy: 'https://senac.gupy.io/jobs/7473980?jobBoardSource=gupy_portal',
    data_publicacao: '16/09/2026'
  },
  {
    cargo: 'Analista de Suporte de TI / Redes',
    empresa: 'Grupo Claudino',
    area: 'Tecnologia da Informação',
    requisitos: [
      'Superior em Redes de Computadores, Ciência da Computação ou Sistemas de Informação',
      'Experiência em suporte a sistemas operacionais Windows/Linux, manutenção de redes TCP/IP, VLANs e roteamento',
      'Atendimento a chamados N1/N2 em ambiente corporativo de grande porte'
    ],
    remuneracao_beneficios: [
      'R$ 3.200,00 (CLT)',
      'Plano de Saúde',
      'Desconto corporativo exclusivo em lojas do grupo (Armazém Paraíba)',
      'Refeitório no local',
      'Vale Transporte'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Pleno',
    link_candidatura_gupy: 'https://grupoclaudino.gupy.io/jobs/7472140?jobBoardSource=gupy_portal',
    data_publicacao: '16/09/2026'
  },
  {
    cargo: 'Farmacêutico(a) Substituto',
    empresa: 'Farmácias Pague Menos Teresina',
    area: 'Saúde / Farmácia',
    requisitos: [
      'Graduação completa em Farmácia com CRF-PI ativo e regular',
      'Disponibilidade para escala de revezamento e atendimento ao balcão',
      'Conhecimento em dispensação de medicamentos controlados (SNGPC)',
      'Atenção farmacêutica, aplicação de injetáveis e testes rápidos'
    ],
    remuneracao_beneficios: [
      'Piso Salarial do Farmacêutico CRF-PI (R$ 4.200,00) + Comissões e Metas',
      'Plano de Saúde e Odontológico Bradesco',
      'Vale Transporte',
      'Vale Refeição',
      'Desconto de até 50% em medicamentos nas farmácias da rede'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Júnior',
    link_candidatura_gupy: 'https://paguemenos.gupy.io/jobs/7468900?jobBoardSource=gupy_portal',
    data_publicacao: '15/09/2026'
  },
  {
    cargo: 'Supervisor(a) de Operações de Varejo / Açougue',
    empresa: 'Grupo Mateus (Mix Atacarejo Teresina)',
    area: 'Varejo e Operações',
    requisitos: [
      'Ensino Médio completo ou Superior em Gestão Comercial/Administração',
      'Experiência sólida na gestão de setores de perecíveis/açougue em atacados ou supermercados',
      'Liderança de equipe, controle de perdas, validade e cumprimento das normas da ANVISA',
      'Disponibilidade de horário para escala 6x1'
    ],
    remuneracao_beneficios: [
      'R$ 3.800,00 (CLT) + Bônus por metas atingidas',
      'Refeição no local',
      'Vale Transporte',
      'Plano de Saúde e Odontológico',
      'Clube de vantagens e descontos em compras no Mateus'
    ],
    modalidade: 'Presencial',
    contrato: 'CLT',
    nivel: 'Sênior',
    link_candidatura_gupy: 'https://grupomateus.gupy.io/jobs/7465320?jobBoardSource=gupy_portal',
    data_publicacao: '15/09/2026'
  }
];

export const GUPY_CONVERTED_JOBS: Job[] = GUPY_RAW_JOBS.map((g, idx) => {
  const companyInitials = g.empresa
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const companyColors = [
    'from-emerald-700 via-teal-700 to-emerald-900',
    'from-blue-700 via-indigo-700 to-slate-900',
    'from-purple-700 via-indigo-700 to-purple-900',
    'from-pink-600 via-rose-700 to-purple-900',
    'from-yellow-600 via-amber-700 to-orange-900',
    'from-sky-600 via-blue-700 to-indigo-900',
    'from-rose-600 via-pink-700 to-purple-900',
    'from-amber-600 via-orange-700 to-red-900',
    'from-cyan-600 via-blue-700 to-indigo-900',
    'from-teal-800 via-emerald-800 to-green-950'
  ];

  const tags = [
    'Gupy Oficial',
    'Teresina',
    g.empresa.split(' ')[0],
    g.area.split('/')[0].trim(),
    g.modalidade,
    g.contrato,
    ...(g.isPcdExclusive ? ['Exclusivo PCD', 'Inclusão'] : [])
  ];

  return {
    id: `gupy-${idx + 1}-${g.empresa.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    title: g.cargo,
    company: g.empresa,
    companyInitials: companyInitials || 'GP',
    companyColor: companyColors[idx % companyColors.length],
    location: 'Teresina - PI',
    workMode: g.modalidade,
    contractType: g.contrato,
    experienceLevel: g.nivel,
    category: g.area.split('/')[0].trim(),
    salary: g.remuneracao_beneficios[0] || 'A Combinar + Benefícios',
    description: `Oportunidade oficial via Portal Gupy: ${g.cargo} na empresa ${g.empresa} em Teresina - PI. Publicada em ${g.data_publicacao}. Candidatura 100% digital diretamente pelo link oficial da Gupy.`,
    requirements: g.requisitos,
    benefits: g.remuneracao_beneficios,
    tags: Array.from(new Set(tags)),
    postedAt: `Gupy • Publicada em ${g.data_publicacao}`,
    timestamp: Date.now() - idx * 1000 * 60 * 20,
    applicationUrl: g.link_candidatura_gupy,
    isNew: true,
    isFeatured: idx < 3,
    viewsCount: Math.floor(65 + Math.random() * 90),
    source: 'Gupy',
    sourceUrl: 'https://portal.gupy.io/job-search/sortBy=publishedDate&state=Piau%C3%AD&city[]=Teresina'
  };
});
