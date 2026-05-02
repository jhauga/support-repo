import { defaultContent } from "./default-content.js";
import { createContentStore, mergeContent } from "./storage.js";

const themeRegistry = {
  starter: {
    stylesheet: "./themes/starter/theme.css",
    load: () => import("../../themes/starter/theme.js"),
  },
};

const refs = {
  controls: document.getElementById("cms-controls"),
  preview: document.getElementById("cms-preview"),
  previewStatus: document.getElementById("preview-status"),
  importInput: document.getElementById("content-import"),
  themeStylesheet: document.getElementById("theme-stylesheet"),
};

const store = createContentStore("theme-workbench-content-v1");

let state = store.load(defaultContent);
let activePanel = "site";
let selectedPageId = state.pages[0]?.id ?? null;
let selectedPostId = state.posts[0]?.id ?? null;
let route = parseHash(window.location.hash) ?? { type: "home" };
let activeTheme = null;

await loadTheme();
bindEvents();
syncSelections();
render();
setStatus("Content saves locally in this browser.");

function bindEvents() {
  refs.controls.addEventListener("click", handleControlsClick);
  refs.controls.addEventListener("input", handleControlsInput);
  refs.controls.addEventListener("change", handleControlsInput);
  refs.preview.addEventListener("click", handlePreviewClick);
  refs.importInput.addEventListener("change", handleImport);
  window.addEventListener("hashchange", () => {
    route = resolveRoute(parseHash(window.location.hash) ?? route);
    renderPreview();
  });
}

async function loadTheme() {
  const definition = themeRegistry[state.theme.current] ?? themeRegistry.starter;
  refs.themeStylesheet.setAttribute("href", definition.stylesheet);
  const module = await definition.load();
  activeTheme = module.theme;
}

function render() {
  syncSelections();
  renderControls();
  renderPreview();
}

function renderControls() {
  refs.controls.innerHTML = `
    <div class="cms-tabs" role="tablist" aria-label="CMS panels">
      ${renderTabButton("site", "Site")}
      ${renderTabButton("pages", "Pages")}
      ${renderTabButton("posts", "Posts")}
      ${renderTabButton("theme", "Theme")}
      ${renderTabButton("data", "Data")}
    </div>
    <section class="cms-panel" role="tabpanel">
      ${renderPanel()}
    </section>
  `;
}

function renderTabButton(panel, label) {
  const selected = panel === activePanel;
  return `
    <button
      type="button"
      class="cms-tab${selected ? " is-active" : ""}"
      data-action="select-panel"
      data-panel="${panel}"
      aria-pressed="${selected}"
    >
      ${label}
    </button>
  `;
}

function renderPanel() {
  if (activePanel === "pages") {
    return renderPagesPanel();
  }

  if (activePanel === "posts") {
    return renderPostsPanel();
  }

  if (activePanel === "theme") {
    return renderThemePanel();
  }

  if (activePanel === "data") {
    return renderDataPanel();
  }

  return renderSitePanel();
}

function renderSitePanel() {
  return `
    <section class="cms-section">
      <h3>Site settings</h3>
      <label class="cms-field">
        <span>Site title</span>
        <input data-target="site.title" type="text" value="${escapeHtml(state.site.title)}">
      </label>
      <label class="cms-field">
        <span>Tagline</span>
        <input data-target="site.tagline" type="text" value="${escapeHtml(state.site.tagline)}">
      </label>
      <label class="cms-field">
        <span>Site description</span>
        <textarea data-target="site.description" rows="4">${escapeHtml(state.site.description)}</textarea>
      </label>
      <label class="cms-field">
        <span>Footer text</span>
        <input data-target="site.footerText" type="text" value="${escapeHtml(state.site.footerText)}">
      </label>
    </section>

    <section class="cms-section">
      <h3>Home page</h3>
      <label class="cms-field">
        <span>Headline</span>
        <input data-target="home.headline" type="text" value="${escapeHtml(state.home.headline)}">
      </label>
      <label class="cms-field">
        <span>Feature label</span>
        <input data-target="home.featuredLabel" type="text" value="${escapeHtml(state.home.featuredLabel)}">
      </label>
      <label class="cms-field">
        <span>Intro copy</span>
        <textarea data-target="home.intro" rows="6">${escapeHtml(state.home.intro)}</textarea>
      </label>
    </section>
  `;
}

function renderPagesPanel() {
  const selectedPage = findSelectedPage();

  return `
    <section class="cms-section">
      <div class="cms-section__header">
        <h3>Pages</h3>
        <button type="button" class="cms-button" data-action="add-page">Add page</button>
      </div>
      <div class="cms-item-list">
        ${state.pages.map((page) => renderItemButton("page", page, selectedPageId)).join("")}
      </div>
    </section>
    ${
      selectedPage
        ? `
          <section class="cms-section">
            <div class="cms-section__header">
              <h3>Edit page</h3>
              <button type="button" class="cms-button cms-button--ghost" data-action="delete-page">
                Delete
              </button>
            </div>
            ${renderEntityEditor("page", selectedPage)}
          </section>
        `
        : ""
    }
  `;
}

function renderPostsPanel() {
  const selectedPost = findSelectedPost();

  return `
    <section class="cms-section">
      <div class="cms-section__header">
        <h3>Posts</h3>
        <button type="button" class="cms-button" data-action="add-post">Add post</button>
      </div>
      <div class="cms-item-list">
        ${state.posts.map((post) => renderItemButton("post", post, selectedPostId)).join("")}
      </div>
    </section>
    ${
      selectedPost
        ? `
          <section class="cms-section">
            <div class="cms-section__header">
              <h3>Edit post</h3>
              <button type="button" class="cms-button cms-button--ghost" data-action="delete-post">
                Delete
              </button>
            </div>
            ${renderEntityEditor("post", selectedPost)}
          </section>
        `
        : ""
    }
  `;
}

function renderItemButton(kind, item, selectedId) {
  const action = kind === "page" ? "select-page" : "select-post";
  const isSelected = item.id === selectedId;
  const meta = kind === "post" ? `${item.category || "General"} • ${item.status}` : item.status;

  return `
    <button
      type="button"
      class="cms-item${isSelected ? " is-selected" : ""}"
      data-action="${action}"
      data-id="${item.id}"
    >
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(meta)}</span>
    </button>
  `;
}

function renderEntityEditor(kind, item) {
  const isPost = kind === "post";

  return `
    <label class="cms-field">
      <span>Title</span>
      <input data-entity="${kind}" data-field="title" type="text" value="${escapeHtml(item.title)}">
    </label>
    <label class="cms-field">
      <span>Slug</span>
      <input data-entity="${kind}" data-field="slug" type="text" value="${escapeHtml(item.slug)}">
    </label>
    <label class="cms-field">
      <span>Excerpt</span>
      <textarea data-entity="${kind}" data-field="excerpt" rows="3">${escapeHtml(item.excerpt)}</textarea>
    </label>
    ${
      isPost
        ? `
          <label class="cms-field">
            <span>Category</span>
            <input
              data-entity="post"
              data-field="category"
              type="text"
              value="${escapeHtml(item.category || "")}"
            >
          </label>
          <label class="cms-field">
            <span>Published date</span>
            <input
              data-entity="post"
              data-field="publishedAt"
              type="date"
              value="${escapeHtml(item.publishedAt || "")}"
            >
          </label>
        `
        : ""
    }
    <label class="cms-field">
      <span>Status</span>
      <select data-entity="${kind}" data-field="status">
        <option value="published" ${item.status === "published" ? "selected" : ""}>Published</option>
        <option value="draft" ${item.status === "draft" ? "selected" : ""}>Draft</option>
      </select>
    </label>
    <label class="cms-field">
      <span>Body</span>
      <textarea data-entity="${kind}" data-field="body" rows="9">${escapeHtml(item.body)}</textarea>
    </label>
  `;
}

function renderThemePanel() {
  const settings = state.theme.settings;

  return `
    <section class="cms-section">
      <h3>Starter theme</h3>
      <p class="cms-helper">
        The starter theme lives under <code>site/themes/starter/</code> so designers can work on
        CSS and templates separately from the CMS runtime.
      </p>
      <label class="cms-field">
        <span>Accent</span>
        <input data-target="theme.settings.accent" type="color" value="${escapeHtml(settings.accent)}">
      </label>
      <label class="cms-field">
        <span>Canvas</span>
        <input data-target="theme.settings.canvas" type="color" value="${escapeHtml(settings.canvas)}">
      </label>
      <label class="cms-field">
        <span>Surface</span>
        <input data-target="theme.settings.surface" type="color" value="${escapeHtml(settings.surface)}">
      </label>
      <label class="cms-field">
        <span>Text</span>
        <input data-target="theme.settings.ink" type="color" value="${escapeHtml(settings.ink)}">
      </label>
      <label class="cms-field">
        <span>Muted text</span>
        <input data-target="theme.settings.muted" type="color" value="${escapeHtml(settings.muted)}">
      </label>
    </section>
  `;
}

function renderDataPanel() {
  return `
    <section class="cms-section">
      <h3>Data and portability</h3>
      <p class="cms-helper">
        GitHub Pages is static hosting, so edits are stored in <code>localStorage</code> for this
        browser. Export snapshots to share or version content fixtures.
      </p>
      <div class="cms-actions">
        <button type="button" class="cms-button" data-action="export-content">Export JSON</button>
        <button type="button" class="cms-button" data-action="import-content">Import JSON</button>
        <button type="button" class="cms-button cms-button--ghost" data-action="reset-content">
          Reset demo content
        </button>
      </div>
    </section>
  `;
}

function renderPreview() {
  const siteVm = toSiteViewModel();
  const homeVm = toHomeViewModel();
  const pages = getPublishedPages().map(toPageViewModel);
  const posts = getPublishedPosts().map(toPostViewModel);
  const currentRoute = resolveRoute(route);

  let body = activeTheme.renderEmptyState({
    title: "Nothing to preview yet",
    message: "Add or publish content from the editor sidebar to populate the theme.",
  });

  if (currentRoute.type === "home") {
    body = activeTheme.renderHome({
      site: siteVm,
      home: homeVm,
      featuredPage: pages[0] ?? null,
      recentPosts: posts.slice(0, 3),
    });
  }

  if (currentRoute.type === "archive") {
    body = posts.length
      ? activeTheme.renderArchive({ posts })
      : activeTheme.renderEmptyState({
          title: "No published posts",
          message: "Publish at least one post to exercise the archive template.",
        });
  }

  if (currentRoute.type === "page") {
    const page = pages.find((entry) => entry.slug === currentRoute.slug);
    body = page
      ? activeTheme.renderPage({ page })
      : activeTheme.renderEmptyState({
          title: "Page not found",
          message: "The selected page is not published or no longer exists.",
        });
  }

  if (currentRoute.type === "post") {
    const post = posts.find((entry) => entry.slug === currentRoute.slug);
    body = post
      ? activeTheme.renderPost({
          post,
          morePosts: posts.filter((entry) => entry.slug !== post.slug).slice(0, 2),
        })
      : activeTheme.renderEmptyState({
          title: "Post not found",
          message: "The selected post is not published or no longer exists.",
        });
  }

  refs.preview.innerHTML = activeTheme.renderShell({
    site: siteVm,
    menu: buildMenu(pages),
    body,
    currentRoute: serializeRoute(currentRoute),
  });

  applyThemeVariables();
}

function buildMenu(pages) {
  return [
    { label: "Home", routeToken: serializeRoute({ type: "home" }) },
    { label: "Journal", routeToken: serializeRoute({ type: "archive" }) },
    ...pages.map((page) => ({
      label: page.title,
      routeToken: serializeRoute({ type: "page", slug: page.slug }),
    })),
  ];
}

function applyThemeVariables() {
  refs.preview.style.setProperty("--theme-accent", state.theme.settings.accent);
  refs.preview.style.setProperty("--theme-canvas", state.theme.settings.canvas);
  refs.preview.style.setProperty("--theme-surface", state.theme.settings.surface);
  refs.preview.style.setProperty("--theme-ink", state.theme.settings.ink);
  refs.preview.style.setProperty("--theme-muted", state.theme.settings.muted);
}

function handleControlsClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const { action } = button.dataset;

  if (action === "select-panel") {
    activePanel = button.dataset.panel;
    renderControls();
    return;
  }

  if (action === "select-page") {
    selectedPageId = button.dataset.id;
    const page = findSelectedPage();
    if (page) {
      navigate({ type: "page", slug: page.slug });
    }
    renderControls();
    return;
  }

  if (action === "select-post") {
    selectedPostId = button.dataset.id;
    const post = findSelectedPost();
    if (post) {
      navigate({ type: "post", slug: post.slug });
    }
    renderControls();
    return;
  }

  if (action === "add-page") {
    const item = createPage();
    state.pages.unshift(item);
    selectedPageId = item.id;
    activePanel = "pages";
    persist("New page draft added.");
    navigate({ type: "page", slug: item.slug });
    return;
  }

  if (action === "delete-page") {
    if (!selectedPageId || state.pages.length === 1) {
      setStatus("Keep at least one page available in the workbench.");
      return;
    }

    const page = findSelectedPage();
    if (!page || !window.confirm(`Delete the page "${page.title}"?`)) {
      return;
    }

    state.pages = state.pages.filter((entry) => entry.id !== selectedPageId);
    selectedPageId = state.pages[0]?.id ?? null;
    persist("Page deleted.");
    navigate({ type: "home" });
    return;
  }

  if (action === "add-post") {
    const item = createPost();
    state.posts.unshift(item);
    selectedPostId = item.id;
    activePanel = "posts";
    persist("New post draft added.");
    navigate({ type: "post", slug: item.slug });
    return;
  }

  if (action === "delete-post") {
    if (!selectedPostId || state.posts.length === 1) {
      setStatus("Keep at least one post available in the workbench.");
      return;
    }

    const post = findSelectedPost();
    if (!post || !window.confirm(`Delete the post "${post.title}"?`)) {
      return;
    }

    state.posts = state.posts.filter((entry) => entry.id !== selectedPostId);
    selectedPostId = state.posts[0]?.id ?? null;
    persist("Post deleted.");
    navigate({ type: "archive" });
    return;
  }

  if (action === "export-content") {
    exportContent();
    return;
  }

  if (action === "import-content") {
    refs.importInput.click();
    return;
  }

  if (action === "reset-content") {
    if (!window.confirm("Reset the workbench to the bundled demo content?")) {
      return;
    }

    store.reset();
    state = mergeContent(defaultContent, {});
    selectedPageId = state.pages[0]?.id ?? null;
    selectedPostId = state.posts[0]?.id ?? null;
    route = { type: "home" };
    persist("Demo content restored.");
    void loadTheme().then(render);
  }
}

function handleControlsInput(event) {
  const input = event.target;

  if (input.matches("[data-target]")) {
    setPath(state, input.dataset.target, input.value);
    persist("Site settings updated.");
    return;
  }

  if (input.matches("[data-entity]")) {
    updateSelectedEntity(input.dataset.entity, input.dataset.field, input.value);
    persist("Content updated.");
  }
}

function handlePreviewClick(event) {
  const routeLink = event.target.closest("[data-route]");
  if (!routeLink) {
    return;
  }

  event.preventDefault();
  const nextRoute = parseRouteToken(routeLink.dataset.route);
  navigate(nextRoute);
}

async function handleImport(event) {
  const [file] = event.target.files ?? [];
  refs.importInput.value = "";

  if (!file) {
    return;
  }

  try {
    const raw = await file.text();
    state = mergeContent(defaultContent, JSON.parse(raw));
    await loadTheme();
    selectedPageId = state.pages[0]?.id ?? null;
    selectedPostId = state.posts[0]?.id ?? null;
    persist("Content imported.");
  } catch {
    setStatus("Import failed. Choose a valid JSON export from this workbench.");
  }
}

function updateSelectedEntity(kind, field, value) {
  const entity = kind === "page" ? findSelectedPage() : findSelectedPost();
  if (!entity) {
    return;
  }

  const oldSlug = entity.slug;
  const previousAutoSlug = slugify(entity.title);

  if (field === "title") {
    entity.title = value;
    if (!oldSlug || oldSlug === previousAutoSlug) {
      entity.slug = slugify(value);
    }
  } else if (field === "slug") {
    entity.slug = slugify(value);
  } else {
    entity[field] = value;
  }

  if (route.type === kind && route.slug === oldSlug) {
    route = { type: kind, slug: entity.slug };
  }
}

function persist(message) {
  store.save(state);
  syncSelections();
  render();
  setStatus(message);
}

function syncSelections() {
  if (!state.pages.some((page) => page.id === selectedPageId)) {
    selectedPageId = state.pages[0]?.id ?? null;
  }

  if (!state.posts.some((post) => post.id === selectedPostId)) {
    selectedPostId = state.posts[0]?.id ?? null;
  }

  route = resolveRoute(route);
}

function resolveRoute(candidate) {
  if (!candidate) {
    return { type: "home" };
  }

  if (candidate.type === "page") {
    const page = getPublishedPages().find((entry) => entry.slug === candidate.slug);
    return page ? candidate : { type: "home" };
  }

  if (candidate.type === "post") {
    const post = getPublishedPosts().find((entry) => entry.slug === candidate.slug);
    return post ? candidate : { type: "archive" };
  }

  if (candidate.type === "archive") {
    return { type: "archive" };
  }

  return { type: "home" };
}

function navigate(nextRoute) {
  route = resolveRoute(nextRoute);
  const hash = `#${serializeRoute(route)}`;
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
  renderPreview();
}

function findSelectedPage() {
  return state.pages.find((page) => page.id === selectedPageId) ?? null;
}

function findSelectedPost() {
  return state.posts.find((post) => post.id === selectedPostId) ?? null;
}

function getPublishedPages() {
  return state.pages.filter((page) => page.status === "published");
}

function getPublishedPosts() {
  return [...state.posts]
    .filter((post) => post.status === "published")
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

function toSiteViewModel() {
  return {
    title: escapeHtml(state.site.title),
    tagline: escapeHtml(state.site.tagline),
    descriptionHtml: richTextToHtml(state.site.description),
    footerText: escapeHtml(state.site.footerText),
  };
}

function toHomeViewModel() {
  return {
    headline: escapeHtml(state.home.headline),
    featuredLabel: escapeHtml(state.home.featuredLabel),
    introHtml: richTextToHtml(state.home.intro),
  };
}

function toPageViewModel(page) {
  return {
    title: escapeHtml(page.title),
    slug: page.slug,
    excerptHtml: richTextToHtml(page.excerpt),
    bodyHtml: richTextToHtml(page.body),
    routeToken: serializeRoute({ type: "page", slug: page.slug }),
  };
}

function toPostViewModel(post) {
  return {
    title: escapeHtml(post.title),
    slug: post.slug,
    excerptHtml: richTextToHtml(post.excerpt),
    bodyHtml: richTextToHtml(post.body),
    category: escapeHtml(post.category || "General"),
    publishedLabel: formatDate(post.publishedAt),
    routeToken: serializeRoute({ type: "post", slug: post.slug }),
  };
}

function createPage() {
  const number = state.pages.length + 1;
  return {
    id: `page-${Date.now()}`,
    title: `New Page ${number}`,
    slug: `new-page-${number}`,
    excerpt: "Draft page summary.",
    status: "draft",
    body: "Add body copy for this page.",
  };
}

function createPost() {
  const number = state.posts.length + 1;
  return {
    id: `post-${Date.now()}`,
    title: `New Post ${number}`,
    slug: `new-post-${number}`,
    excerpt: "Draft post summary.",
    category: "Updates",
    publishedAt: new Date().toISOString().slice(0, 10),
    status: "draft",
    body: "Add body copy for this post.",
  };
}

function exportContent() {
  const file = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = window.URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "theme-workbench-content.json";
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  setStatus("Content exported.");
}

function parseHash(hash) {
  if (!hash || hash === "#") {
    return null;
  }

  return parseRouteToken(hash.replace(/^#/, ""));
}

function parseRouteToken(token) {
  if (token === "archive") {
    return { type: "archive" };
  }

  if (token.startsWith("page/")) {
    return { type: "page", slug: token.slice(5) };
  }

  if (token.startsWith("post/")) {
    return { type: "post", slug: token.slice(5) };
  }

  return { type: "home" };
}

function serializeRoute(value) {
  if (value.type === "archive") {
    return "archive";
  }

  if (value.type === "page") {
    return `page/${value.slug}`;
  }

  if (value.type === "post") {
    return `post/${value.slug}`;
  }

  return "home";
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "untitled";
}

function setPath(target, path, value) {
  const segments = path.split(".");
  let current = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    current = current[segments[index]];
  }

  current[segments[segments.length - 1]] = value;
}

function richTextToHtml(value) {
  return value
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function setStatus(message) {
  refs.previewStatus.textContent = message;
}
