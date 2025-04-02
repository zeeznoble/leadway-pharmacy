export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Leadway Health",
  description: "Leadway Health provides affordable, customer-focused and value-based health insurance packages and services leveraging on digital technology.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },

  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },

  ],
  links: {
    github: "https://github.com/frontio-ai/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
