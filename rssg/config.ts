import { RssgConfig } from "./cfg"
import * as Plugin from "./plugins"

const styles = {
  light: "hsl(273, 16%, 34%)",
  lightgray: "rgba(0, 0, 0, 0.15)",
  gray: "#fff",
  darkgray: "#fff",
  dark: "#fff",
  secondary: "#fff",
  tertiary: "#fff",
  highlight: "rgba(0, 0, 0, 0.15)",
  textHighlight: "rgba(0, 0, 0, 0.45)",
};

const config: RssgConfig = {
  configuration: {
    hostTitle: "noxabellus",
    hostUrl: "https://noxabell.us",
    docTitle: "Anamnesis",
    docTitleSuffix: "The Eidolon Tapestries",
    pageTitle: "Anamnesis: The Eidolon Tapestries",
    pageTitleSuffix: "noxabellus' Anamnesis",
    baseUrl: "atet.site",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Roboto",
        body: "Roboto",
        code: "Roboto Mono",
      },
      colors: {
        lightMode: styles,
        darkMode: styles,
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      // Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Plugin.IndexPage(),
    ],
  },
}

export default config
