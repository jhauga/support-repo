function renderPostCards(posts) {
  return posts
    .map(
      (post) => `
        <article class="theme-card">
          <p class="theme-meta">${post.category} • ${post.publishedLabel}</p>
          <h3><a href="#${post.routeToken}" data-route="${post.routeToken}">${post.title}</a></h3>
          <div class="theme-copy">${post.excerptHtml}</div>
        </article>
      `,
    )
    .join("");
}

export const theme = {
  id: "starter",
  label: "Starter Theme",
  renderShell({ site, menu, body, currentRoute }) {
    return `
      <div class="theme-shell">
        <header class="theme-header">
          <div class="theme-brand">
            <p class="theme-kicker">Starter Theme</p>
            <h1>${site.title}</h1>
            <p>${site.tagline}</p>
          </div>
          <nav class="theme-nav" aria-label="Theme navigation">
            ${menu
              .map(
                (item) => `
                  <a
                    href="#${item.routeToken}"
                    data-route="${item.routeToken}"
                    class="${item.routeToken === currentRoute ? "is-active" : ""}"
                  >
                    ${item.label}
                  </a>
                `,
              )
              .join("")}
          </nav>
        </header>
        <main class="theme-main">${body}</main>
        <footer class="theme-footer">
          <div class="theme-copy">${site.descriptionHtml}</div>
          <p>${site.footerText}</p>
        </footer>
      </div>
    `;
  },
  renderHome({ home, featuredPage, recentPosts }) {
    return `
      <section class="theme-home-hero">
        <div>
          <p class="theme-kicker">${home.featuredLabel}</p>
          <h2>${home.headline}</h2>
        </div>
        <div class="theme-copy">${home.introHtml}</div>
      </section>

      ${
        featuredPage
          ? `
            <section class="theme-spotlight">
              <div>
                <p class="theme-kicker">Featured page</p>
                <h3>${featuredPage.title}</h3>
                <div class="theme-copy">${featuredPage.excerptHtml}</div>
              </div>
              <a
                class="theme-link"
                href="#${featuredPage.routeToken}"
                data-route="${featuredPage.routeToken}"
              >
                Read the page
              </a>
            </section>
          `
          : ""
      }

      <section class="theme-stack">
        <div class="theme-section-heading">
          <h3>Recent posts</h3>
          <a class="theme-link" href="#archive" data-route="archive">View archive</a>
        </div>
        <div class="theme-grid">
          ${
            recentPosts.length
              ? renderPostCards(recentPosts)
              : `
                <article class="theme-card">
                  <h3>No posts yet</h3>
                  <p>Publish a post from the CMS sidebar to populate this section.</p>
                </article>
              `
          }
        </div>
      </section>
    `;
  },
  renderPage({ page }) {
    return `
      <article class="theme-article">
        <p class="theme-kicker">Page</p>
        <h2>${page.title}</h2>
        <div class="theme-copy">${page.bodyHtml}</div>
      </article>
    `;
  },
  renderPost({ post, morePosts }) {
    return `
      <article class="theme-article">
        <p class="theme-meta">${post.category} • ${post.publishedLabel}</p>
        <h2>${post.title}</h2>
        <div class="theme-copy">${post.bodyHtml}</div>
      </article>
      ${
        morePosts.length
          ? `
            <section class="theme-stack">
              <div class="theme-section-heading">
                <h3>More stories</h3>
                <a class="theme-link" href="#archive" data-route="archive">Browse all</a>
              </div>
              <div class="theme-grid">
                ${renderPostCards(morePosts)}
              </div>
            </section>
          `
          : ""
      }
    `;
  },
  renderArchive({ posts }) {
    return `
      <section class="theme-section-heading">
        <div>
          <p class="theme-kicker">Archive</p>
          <h2>Journal</h2>
        </div>
      </section>
      <div class="theme-grid">
        ${renderPostCards(posts)}
      </div>
    `;
  },
  renderEmptyState({ title, message }) {
    return `
      <section class="theme-card">
        <h2>${title}</h2>
        <p>${message}</p>
      </section>
    `;
  },
};
