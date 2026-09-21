# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request 3584](https://github.com/github/awesome-copilot/pull/3584)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/instruction-make-blog-post/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Instructions to assist in the automation, or help in making blog post for a workspace, repo, or as a standalone post.

## Test Conditions

### Evaluation Context

- **Session Target**: Local
- **Agent**: Agent
- **Model**: Claude Sonnet 5
  - **Thinking Effort**: High
- **Number of Prompts**: 1
- **Post Edits**: Yes
  - In `index.html` page; title changed, and template elements removed
<!-- NOTE: change if updated -->
### Copilot Pro+ Plan Credit Usage

- **Start Credits**: 1%
- **End Credits**: 1%

### Prompt

```bash
Make a post about this branch written for Github Pages. Update index.html for
entry, and new post accoring to insturctions.
```

### Results

Good.

- Asked to proceed: Pass
- Asked for post to be approved: Pass
- New post file created: Passed using repo, and did not resolve to using a global path
  - Path used: pass
  - File used: pass
- Ended Response correctly: Pass

<!-- formatter_2 -->