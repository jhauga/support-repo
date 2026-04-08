# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [github/awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/898)

- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-typescript-coder/index.html)

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
## Test 1

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

## Test 2

**Agent**: Local
**Model**: Claude Sonnet 4.6
**Number of Prompts**: 2
**Post Edits**:  none

### Prompt

```bash
typescript-coder --variation [index.html,contact.html] --call-it orderB
                 --command `()=>mkdir orderA & move "index.html,contact.html and relvant files" orderA`
                 --command `()=>mkdir orderB & typescript-code variation of orderA`
                 --create launch-page --call-it "index.html"
                 --all-pages-hosted-on "GitHub Pages" --create-production-elements=false
                 --use-cdn-for-development=true
```

### Results

After first prompt, a console error had to be resolve. A copy/paste of console error to second prompt, and the end results - better than the first. The script tag was all TypeScript syntax, so - I feel better about the updates.

## Test 3

**Agent**: Local
**Model**: Claude Sonnet 4.5
**Number of Prompts**: 1
**Post Edits**: none

### Prompt

```bash
typescript-coder --new-variation orderC 
                 --language=typeScript
                 --variation-of "orderA" + "orderB"
                 --variation-keeps form-elements
                 --variation-does redo-script-for-form-use-typescript
                 --add-to-launch-page-index.html=true
                 --use-production-elements=false --use-development-elements=true
                 --variation-folder orderC
```

### Results

Good results:

- Functional form
- Throws error on missing required fields
- Throws errors on invalid fields