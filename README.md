# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [github/awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/898)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/itWorked/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill typescript-coder.

- **Agent**: Local
- **Model**: Claude Sonnet 4.5
- **Number of Prompts**: 1
- **Post Edits**: added 1 line:
  - `<link href="favicon.png" rel="icon">`

### Prompt

```bash
ts-coder --create web-application 
         --project-scope worlds-most-cliche-type-safe-web-app 
         --use-library react 
         --run-in-browser=true 
         --create-pages [home(index.html), contact.html] 
         --page home="generic form to order parts from a manufacturer" 
         --page contact="generic form to contact customer support" 
         --app-hosting GitHubPages
```

### Results

Good results:

- Functional form
- Throws error on missing required fields
- Throws errors on invalid fields

I thinkg this could be configurred and plugged into a server after adding production elements.

<!-- formatter_2 -->