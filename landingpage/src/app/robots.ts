import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://omniattend.ai";
  
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/", // disallow indexing of private admin panels
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
