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

    const jobs = rawJobs.map((raw: any, idx: number) => {
      const company = (raw.careerPageName || 'Empresa parceira').split(' - ')[0].split(' #')[0].trim();
      const wp = raw.workplaceType;
      const workMode = wp === 'remote' ? 'Remoto' : wp === 'hybrid' ? 'Híbrido' : 'Presencial';
      
      return {
        id: `gupy-${raw.id}`,
        title: raw.name?.trim() || 'Vaga Gupy',
        company,
        companyInitials: company.slice(0, 2).toUpperCase(),
        companyColor: 'from-purple-700 via-indigo-700 to-purple-900',
        location: `${raw.city || 'Teresina'} - ${raw.state || 'PI'}`,
        workMode,
        contractType: 'CLT',
        experienceLevel: 'Júnior',
        category: 'Geral',
        salary: 'Salário a combinar (Confira na Gupy)',
        description: (raw.description || '').replace(/<[^>]+>/g, ' ').slice(0, 300) + '...',
        requirements: ['Confira todos os requisitos detalhados no link oficial da Gupy.'],
        benefits: ['Benefícios informados no processo seletivo da empresa parceira.'],
        tags: ['Gupy Oficial', 'Teresina', workMode, 'CLT'],
        postedAt: 'Gupy • Recente',
        timestamp: new Date(raw.publishedDate || Date.now()).getTime(),
        applicationUrl: raw.jobUrl || 'https://portal.gupy.io',
        isNew: true,
        isFeatured: idx < 3,
        viewsCount: 45 + idx * 2,
        source: 'Gupy',
        sourceUrl: raw.jobUrl || 'https://portal.gupy.io'
      };
    });

    return res.status(200).json({
      success: true,
      total: jobs.length,
      jobs
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message, jobs: [] });
  }
}
