# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/970)
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-typescript-package-manager/index.html)


<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill typescript-package-manager.

- **Agent**: Local
- **Model**: Claude Opus 4.6
- **Number of Prompts**: 1
- **Post Edits**: None

### Prompt

```bash
typescript-package-manager Create a mock documentation site for a
TypeScript tool that has variations for several package managers.
The site will be hosted on GitHub Pages, so - use development tools
and no production elements. The TypeScript tool will compare files in
regards to file size, date created, and date modified; and will be
able to check local and remote files. With one condition - by default
the files must have the same file name, else utilize a specific
option for when comparing files with different names.

In addition to making the mock documentation site, create a smoke and
mirror demo where core functionality of the tool can be tested. Use a
form that will not write to a file, but simulate updating local and
remote files.

Break this into two prompts.
```

### Results

Good.
<!-- formatter_2 -->