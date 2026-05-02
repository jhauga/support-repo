export const defaultContent = {
  site: {
    title: "Studio Atlas",
    tagline: "Editorial theme previews without a full WordPress install.",
    description:
      "Use this workbench to shape layout, typography, featured stories, and archive views before moving the design into a production WordPress theme.",
    footerText: "Built for theme prototyping on GitHub Pages.",
  },
  home: {
    headline: "Ship your next WordPress theme with a faster feedback loop.",
    intro:
      "This lightweight CMS keeps example pages, blog posts, and starter theme settings in the browser so you can iterate on layout and presentation without standing up PHP.\n\nIt mirrors common WordPress surfaces such as the home page, archive, singular posts, and static pages.",
    featuredLabel: "Theme-friendly content preview",
  },
  theme: {
    current: "starter",
    settings: {
      accent: "#2563eb",
      canvas: "#f4f7fb",
      surface: "#ffffff",
      ink: "#0f172a",
      muted: "#64748b",
    },
  },
  pages: [
    {
      id: "page-about",
      title: "About the Studio",
      slug: "about-the-studio",
      excerpt: "A sample long-form page to validate spacing, headings, and editorial rhythm.",
      status: "published",
      body:
        "Studio Atlas is a fictional design collective used to test hero copy, column rhythm, and content spacing across a WordPress-style theme.\n\nThis page is intentionally editorial so you can tune typography, cards, and callouts before porting the design to PHP templates.",
    },
    {
      id: "page-services",
      title: "Services",
      slug: "services",
      excerpt: "A second page helps test menu sizing, page summaries, and content hierarchy.",
      status: "published",
      body:
        "The studio offers design systems, prototype theming, and content modeling support.\n\nSwap this content for your own client copy to see how the starter theme handles longer and shorter sections.",
    },
  ],
  posts: [
    {
      id: "post-faster-prototyping",
      title: "Faster Theme Prototyping with Static Content",
      slug: "faster-theme-prototyping",
      excerpt: "Move quickly on spacing, hierarchy, and component patterns before wiring PHP.",
      category: "Workflow",
      publishedAt: "2026-05-01",
      status: "published",
      body:
        "Static content previews give you a fast loop for reviewing typography, cards, and responsive layout changes.\n\nOnce the front-end language feels right, you can port the same structure into WordPress templates with less guesswork.",
    },
    {
      id: "post-preview-archives",
      title: "Preview Archive States Early",
      slug: "preview-archive-states-early",
      excerpt: "Archive cards, metadata, and empty states usually need their own pass.",
      category: "Theme Design",
      publishedAt: "2026-04-27",
      status: "published",
      body:
        "A believable archive page helps you spot weak excerpts, cramped metadata, or inconsistent thumbnail rhythm.\n\nUse this starter content to pressure-test archive layouts before you map them to the WordPress loop.",
    },
    {
      id: "post-draft",
      title: "Draft Content Example",
      slug: "draft-content-example",
      excerpt: "Draft entries stay editable but do not appear in the public preview.",
      category: "Editorial",
      publishedAt: "2026-04-20",
      status: "draft",
      body:
        "Drafts are useful when you want to work on unfinished copy without changing the live preview.",
    },
  ],
};
