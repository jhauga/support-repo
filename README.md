# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/1591) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->

- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/plugin-cms-development/index.html)

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new plugin cms-development.

- **Agent**: Copilot CLI
- **Model**: GPT-5.4
- **Number of Prompts**:
- **Post Edits**:

### Prompt

```bash
# after running `copilot --plugin-dir .GitHub/plugins/cms-development` and installing
Create a light-weight Content Management System that can be used to test
Wordpress themes being developed. The final tool should be able to deploy in
GitHub Pages via an action, so - we also need to create a workflow that will
deploy the site to a GitHub Pages environment. Lastly we need a basic theme to
work on for this application.
```

### Results

- Added a lightweight static CMS under `site/` with browser-side editing for site settings, pages, posts, and theme tokens.
- Added a starter theme under `site/themes/starter/` so layout and styling changes stay separate from CMS runtime code.
- Added `deploy-pages.yml` to publish the `site/` directory to GitHub Pages.
- Content is intentionally stored in browser `localStorage` with JSON import/export because GitHub Pages cannot run a writable WordPress backend.
<!-- formatter_2 -->
