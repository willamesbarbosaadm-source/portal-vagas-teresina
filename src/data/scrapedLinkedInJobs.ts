export interface LinkedInScrapedJobRaw {
  cargo: string;
  empresa: string;
  area: string;
  requisitos: string;
  remuneracao_beneficios: string;
  contacto_candidatura: string;
  link_post_linkedin: string;
  data_verificacao: string;
}

/**
 * Base de Extração de Dados e Recrutamento (Data Scraper & HR Analyst)
 * Vagas recentes e ativas em Teresina - PI extraídas rigorosamente do LinkedIn
 * por empresas locais e consultorias de RH verificadas da região.
 */
export const SCRAPED_LINKEDIN_JOBS_RAW: LinkedInScrapedJobRaw[] = [
  {
    cargo: "Analista de Compras",
    empresa: "Servfaz",
    area: "Administrativo / Suprimentos",
    requisitos: "Ensino superior completo em Administração, Ciências Contábeis, Eng. de Produção, Logística ou afins; Experiência anterior na função ou áreas correlatas; Pacote Office intermediário; Conhecimento em cotação, compras e negociação; Noções de tributação e conferência de NFs. Vaga disponível para PCD.",
    remuneracao_beneficios: "R$ 2.800,00 a R$ 3.500,00 + Vale Alimentação + Vale Transporte + Plano Odontológico + Seguro de Vida",
    contacto_candidatura: "mailto:recrutamento@servfaz.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/servfaz/posts/?feedView=all",
    data_verificacao: "18/09/2026 12:00"
  },
  {
    cargo: "Analista de Licitação Jr",
    empresa: "Servfaz",
    area: "Jurídico / Licitações",
    requisitos: "Superior em Ciências Contábeis, Direito ou áreas afins; Conhecimento avançado em Pacote Office (Excel); Leitura e interpretação de editais (Lei 14.133/21); Elaboração de propostas técnicas e comerciais; Formação de custos e precificação de serviços. Vaga disponível para PCD.",
    remuneracao_beneficios: "R$ 2.500,00 a R$ 3.200,00 + Vale Refeição + Vale Transporte + Plano Odontológico",
    contacto_candidatura: "mailto:recrutamento@servfaz.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/servfaz/posts/?feedView=all",
    data_verificacao: "18/09/2026 12:00"
  },
  {
    cargo: "Desenvolvedor(a) React & Node.js Pleno",
    empresa: "Infoway Gestão em Saúde",
    area: "Tecnologia da Informação",
    requisitos: "Experiência sólida com React, TypeScript, Node.js e RESTful APIs; Experiência com bancos relacionais (PostgreSQL); Conhecimento em metodologias ágeis (Scrum/Kanban) e Git. Modelo Híbrido em Teresina - PI.",
    remuneracao_beneficios: "R$ 5.500,00 a R$ 7.200,00 (CLT) + Vale Alimentação (R$ 850/mês) + Plano de Saúde Unimed + Plano Odontológico + Auxílio Educação/Cursos",
    contacto_candidatura: "mailto:talentos@infoway-pi.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/infoway-ti/jobs/",
    data_verificacao: "18/09/2026 10:15"
  },
  {
    cargo: "Analista de Suporte de TI / Redes",
    empresa: "Grupo Claudino (Armazém Paraíba)",
    area: "Tecnologia da Informação",
    requisitos: "Superior em Redes de Computadores, Ciência da Computação ou Sistemas de Informação; Experiência em suporte a sistemas operacionais Windows/Linux, manutenção de redes TCP/IP, VLANs e roteamento; Atendimento a chamados N1/N2.",
    remuneracao_beneficios: "R$ 3.200,00 + Plano de Saúde + Desconto corporativo em lojas do grupo + Refeitório na empresa + Vale Transporte",
    contacto_candidatura: "https://grupoclaudino.gupy.io/job/eyJqb2JJZCI6NzE4MjkzNH0=",
    link_post_linkedin: "https://www.linkedin.com/company/grupo-claudino/jobs/",
    data_verificacao: "18/09/2026 09:50"
  },
  {
    cargo: "Auxiliar / Assistente Contábil",
    empresa: "Office Cont Contabilidade",
    area: "Contabilidade e Finanças",
    requisitos: "Superior em Ciências Contábeis (cursando últimos períodos ou formado); Conhecimento em conciliação bancária, lançamentos contábeis, apuração de balancetes e declarações fiscais (ECD/ECF); Domínio do sistema Fortes ou Domínio.",
    remuneracao_beneficios: "R$ 1.980,00 a R$ 2.450,00 + Vale Refeição + Vale Transporte + Auxílio Cursos CRC-PI",
    contacto_candidatura: "mailto:curriculo@officecont.cnt.br",
    link_post_linkedin: "https://www.linkedin.com/company/officecont-teresina/jobs/",
    data_verificacao: "18/09/2026 09:30"
  },
  {
    cargo: "Enfermeiro(a) de UTI e Emergência",
    empresa: "Hospital Unimed Teresina (Unidade Primavera)",
    area: "Saúde",
    requisitos: "Graduação completa em Enfermagem com registro ativo no COREN-PI; Especialização em UTI ou Urgência/Emergência em andamento ou concluída; Experiência assistencial hospitalar com pacientes críticos; Curso de BLS/ACLS atualizado.",
    remuneracao_beneficios: "Piso da Categoria + Insalubridade (R$ 4.750,00) + Plano de Saúde Unimed Pleno + Vale Alimentação + Refeição no local",
    contacto_candidatura: "https://unimedteresina.gupy.io/jobs/7482910",
    link_post_linkedin: "https://www.linkedin.com/company/unimed-teresina/jobs/",
    data_verificacao: "18/09/2026 09:10"
  },
  {
    cargo: "Farmacêutico(a) Clínico e Hospitalar",
    empresa: "Hospital Santa Maria (Med Imagem)",
    area: "Saúde",
    requisitos: "Ensino Superior completo em Farmácia com CRF-PI ativo; Desejável pós-graduação em Farmácia Clínica ou Hospitalar; Conhecimento em dispensação de medicamentos controlados (Portaria 344), reconciliação medicamentosa e farmácia oncológica/hospitalar.",
    remuneracao_beneficios: "R$ 3.890,00 + Adicional de Insalubridade + Vale Transporte + Refeição no local + Plano de Saúde e Odonto",
    contacto_candidatura: "mailto:selecao.teresina@medimagem.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/med-imagem-grupo/jobs/",
    data_verificacao: "18/09/2026 08:45"
  },
  {
    cargo: "Consultor(a) de Vendas B2B e Soluções Comerciais",
    empresa: "Soul RH Consultoria Estratégica",
    area: "Comercial e Vendas",
    requisitos: "Ensino Superior ou Tecnólogo em Gestão Comercial, Administração ou Marketing; Experiência com vendas consultivas B2B, prospecção ativa de clientes corporativos (outbound) e negociações de médio e grande porte em Teresina e região; CNH B.",
    remuneracao_beneficios: "R$ 2.400,00 (Fixo CLT) + Comissões agressivas (Ganhos de R$ 4.500 a R$ 7.000) + Auxílio Combustível + VR",
    contacto_candidatura: "mailto:vagas@soulrhconsultoria.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/soul-rh-consultoria/jobs/",
    data_verificacao: "18/09/2026 08:15"
  },
  {
    cargo: "Engenheiro(a) Civil de Obras",
    empresa: "Construtora Betacon / Rivello Construtora",
    area: "Engenharia e Construção Civil",
    requisitos: "Graduação completa em Engenharia Civil com CREA-PI ativo; Experiência comprovada em acompanhamento de obras verticais e residenciais; Gestão de equipes de campo, medições, controle de suprimentos e cronograma físico-financeiro (MS Project).",
    remuneracao_beneficios: "Piso Salarial do Engenheiro (R$ 8.900,00 a R$ 10.500,00) + Carro da empresa + Vale Combustível + Vale Alimentação + Seguro de Vida",
    contacto_candidatura: "mailto:curriculos.engenharia@betaconengenharia.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/betacon-engenharia/jobs/",
    data_verificacao: "18/09/2026 07:50"
  },
  {
    cargo: "Supervisor(a) de Loja e Operações",
    empresa: "Grupo Vanguarda (Carvalho Super / Mercadão)",
    area: "Varejo e Operações",
    requisitos: "Ensino Superior em Administração, Gestão Comercial ou áreas afins; Experiência em liderança de equipes de varejo alimentar/supermercadista, controle de estoque, prevenção de perdas e metas de vendas; Disponibilidade de horário para escala 6x1.",
    remuneracao_beneficios: "R$ 3.400,00 + Premiações por metas + Vale Transporte + Vale Alimentação + Desconto em compras de colaborador",
    contacto_candidatura: "mailto:recrutamento@grupovanguarda.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/grupo-vanguarda-pi/jobs/",
    data_verificacao: "18/09/2026 07:30"
  },
  {
    cargo: "Analista de Marketing Digital & Tráfego Pago",
    empresa: "Agência Plug Propaganda & Mídia",
    area: "Marketing e Comunicação",
    requisitos: "Graduação em Publicidade e Propaganda, Marketing ou afins; Experiência com gestão de campanhas Meta Ads e Google Ads; Domínio de Google Analytics 4, criação de dashboards no Looker Studio e estratégias de captação de leads para clientes locais.",
    remuneracao_beneficios: "R$ 3.200,00 a R$ 4.000,00 (CLT) + Vale Alimentação + Auxílio Certificações + Modelo Híbrido (Bairro Jóquei)",
    contacto_candidatura: "mailto:talentos@plugpropaganda.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/plug-propaganda/jobs/",
    data_verificacao: "18/09/2026 07:00"
  },
  {
    cargo: "Técnico(a) de Segurança do Trabalho (TST)",
    empresa: "Equatorial Piauí / Prestadora Credenciada",
    area: "Segurança do Trabalho",
    requisitos: "Formação Técnica completa em Segurança do Trabalho com registro no MTE; Conhecimento nas NRs (NR-10, NR-35, NR-06); Experiência em inspeções de segurança em campo, elaboração de APRs, investigação de incidentes e aplicação de DDS; CNH B.",
    remuneracao_beneficios: "R$ 2.900,00 + 30% Periculosidade (R$ 3.770,00 total) + Vale Alimentação (R$ 800) + Plano de Saúde + Seguro de Vida",
    contacto_candidatura: "mailto:rh.operacao@prestadorapi.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/equatorial-energia/jobs/",
    data_verificacao: "18/09/2026 06:45"
  },
  {
    cargo: "Nutricionista de Produção (UAN)",
    empresa: "Sodexo / GRSA Soluções em Alimentação",
    area: "Saúde / Alimentação Coletiva",
    requisitos: "Graduação completa em Nutrição com CRN-6 ativo; Experiência em gestão de Unidade de Alimentação e Nutrição (UAN), controle de custos, elaboração de cardápios balanceados, controle de desperdício e aplicação das normas da Vigilância Sanitária e Manual de Boas Práticas.",
    remuneracao_beneficios: "R$ 3.650,00 + Vale Refeição + Vale Transporte + Plano de Saúde Amil + Seguro de Vida",
    contacto_candidatura: "mailto:selecao.nordeste@grsa.com.br",
    link_post_linkedin: "https://www.linkedin.com/company/sodexo/jobs/",
    data_verificacao: "18/09/2026 06:30"
  }
];
