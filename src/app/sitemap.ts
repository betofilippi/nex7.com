import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nex7.com';
  
  // Static routes
  const staticRoutes = [
    '',
    '/login',
    '/signup',
    '/onboarding',
    '/canvas',
    '/agents',
    '/vercel-demo',
  ];

  // Generate sitemap entries for static routes
  const staticSitemapEntries = staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic routes would be added here
  // For example, if you have user profiles or blog posts:
  // const dynamicRoutes = await getDynamicRoutes();
  
  return [
    ...staticSitemapEntries,
    // ...dynamicRoutes
  ];
}

// If you have dynamic routes, implement this function
// async function getDynamicRoutes() {
//   // Fetch data from your database or API
//   // const posts = await prisma.post.findMany();
//   // return posts.map(post => ({
//   //   url: `${baseUrl}/blog/${post.slug}`,
//   //   lastModified: post.updatedAt,
//   //   changeFrequency: 'weekly' as const,
//   //   priority: 0.6,
//   // }));
//   return [];
// }