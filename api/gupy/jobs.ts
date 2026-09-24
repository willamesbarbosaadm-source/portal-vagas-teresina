// Vercel Serverless Function to fetch live Gupy jobs for Teresina
export default async function handler(req: any, res: any) {
  try {
    const url = 'https://portal.gupy.io/api/job-search/jobs?city=Teresina&state=Piau%C3%AD&limit=100&offset=0&sortBy=publishedDate';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!response.ok) {
      return res.status(200).json({ success: false, message: 'Gupy API returned status ' + response.status, jobs: [] });
    }

    const data = await response.json();
    const rawJobs = data.data || [];

    function mapContractType(rawType: string): string {
      switch (rawType) {
        case 'vacancy_type_effective': return 'Efetivo (CLT)';
        case 'vacancy_type_internship': return 'Estágio';
        case 'vacancy_type_apprentice': return 'Jovem Aprendiz';
        case 'vacancy_type_temporary': return 'Temporário';
        case 'vacancy_type_talent_pool': return 'Banco de Talentos';
        case 'vacancy_type_autonomous': return 'Autônomo';
        case 'vacancy_legal_entity': return 'PJ (Pessoa Jurídica)';
        default: return 'Não informado pela fonte';
      }
    }

    function mapWorkMode(wp: string): string {
      if (wp === 'remote') return 'Remoto';
      if (wp === 'hybrid') return 'Híbrido';
      if (wp === 'on-site') return 'Presencial';
      return 'Não informado pela fonte';
    }

    function mapLocation(raw: any): string {
      if (raw.workplaceType === 'remote') return 'Remoto';
      if (raw.city && raw.state) return `${raw.city} - ${raw.state}`;
      if (raw.city) return raw.city;
      return 'Não informado pela fonte';
    }

    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const jobs: any[] = [];

    for (const raw of rawJobs) {
      const isTeresina = (raw.city && raw.city.toLowerCase() === 'teresina') || (!raw.city && raw.state && raw.state.toLowerCase() === 'piauí');
      const isRemote = raw.workplaceType === 'remote';
      if (!isTeresina && !isRemote) {
        continue;
      }

      const id = `gupy-${raw.id}`;
      const appUrl = raw.jobUrl || '';

      if (seenIds.has(id)) continue;
      if (appUrl && seenUrls.has(appUrl)) continue;

      seenIds.add(id);
      if (appUrl) seenUrls.add(appUrl);

      const company = raw.careerPageName ? (raw.careerPageName.split(' - ')[0].split(' #')[0].trim()) : 'Não informado pela fonte';
      const workMode = mapWorkMode(raw.workplaceType);
      const contractType = mapContractType(raw.type);
      const location = mapLocation(raw);

      let postedAt = 'Data de publicação não informada pela fonte';
      let timestamp = 0;
      let publishedDate: string | undefined = undefined;
      let isNew = false;

      if (raw.publishedDate) {
        const pubDate = new Date(raw.publishedDate);
        if (!isNaN(pubDate.getTime())) {
          timestamp = pubDate.getTime();
          publishedDate = raw.publishedDate;
          postedAt = pubDate.toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' });
          isNew = (Date.now() - timestamp) <= (7 * 24 * 60 * 60 * 1000);
        }
      }

      const descClean = (raw.description || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      jobs.push({
        id,
        title: raw.name?.trim() || 'Título não informado pela fonte',
        company,
        companyInitials: company && company !== 'Não informado pela fonte' ? company.slice(0, 2).toUpperCase() : 'GP',
        companyColor: 'from-purple-700 via-indigo-700 to-purple-900',
        location,
        workMode,
        contractType,
        experienceLevel: 'Sem Experiência',
        category: 'Geral',
        salary: 'Não informado pela fonte',
        education: 'Não informado pela fonte',
        description: descClean.length > 0 ? (descClean.slice(0, 300) + '...') : 'Descrição não informada pela fonte',
        requirements: ['Consulte os requisitos completos no link oficial da Gupy.'],
        benefits: ['Consulte os benefícios no link oficial da Gupy.'],
        tags: ['Gupy Oficial', location.includes('Teresina') ? 'Teresina' : location, workMode, contractType].filter(Boolean),
        postedAt,
        timestamp,
        publishedDate,
        applicationUrl: appUrl,
        isNew,
        isFeatured: false,
        viewsCount: 0,
        source: 'Gupy',
        sourceUrl: appUrl,
        pcdOnly: Boolean(raw.disabilities)
      });
    }

    return res.status(200).json({
      success: true,
      total: jobs.length,
      jobs
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message, jobs: [] });
  }
}
