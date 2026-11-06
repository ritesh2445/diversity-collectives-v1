import { useEffect } from 'react';

/**
 * Custom hook to update document title, description, canonical link, and OpenGraph meta tags
 */
export function usePageMeta({ title, description, canonicalPath, ogImage }) {
  useEffect(() => {
    const baseTitle = 'Diversity Collective Ventura County';
    const fullTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} | You Are Welcome Here`;
    const defaultDesc = 'Diversity Collective Ventura County is a 501(c)(3) nonprofit providing advocacy, visibility, safety, and wellness for the LGBTQ+ community throughout Ventura County.';
    const metaDesc = description || defaultDesc;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://diversitycollective.org';
    const canonicalUrl = `${origin}${canonicalPath || ''}`;
    const previewImage = ogImage || `${origin}/images/hero-community.jpg`;

    // 1. Title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const setMetaTag = (attribute, key, content) => {
      let tag = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Standard Meta Description
    setMetaTag('name', 'description', metaDesc);

    // 3. OpenGraph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:image', previewImage);
    setMetaTag('property', 'og:site_name', 'Diversity Collective Ventura County');

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', metaDesc);
    setMetaTag('name', 'twitter:image', previewImage);

    // 5. Canonical Link Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

  }, [title, description, canonicalPath, ogImage]);
}

