# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request 2027](https://github.com/github/awesome-copilot/pull/2027)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/hook-fix-broken-links/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new hook fix-broken-links.

- **Agent**: Copilot CLI
- **Model**: Claude Sonnet 4.5
- **Number of Prompts**: 1
- **Post Edits**: None

### Prompt

**Context**

Two links were broken:

- [ai skills](https://www.microsoft.com/en-us/corporate-responsibility/ai-skils-resources)
- [design-methodology](https://learn.microsoft.com/en-us/azure/well-architected/ai/methodology)

And one could use SEO and/or better link text:

- [principles](https://learn.microsoft.com/en-us/azure/well-architected/ai/design-principles)

```bash
Write a brief blog article referencing about ai research techniques, and organizing research
in such a way that it can easliy be kept up-to-date with ai changes; and incorporating
research findings in order to build ai skills. Update @index.html as HTML with the final data.

**References:**

- [ai-research](https://www.microsoft.com/en-us/research/group/ai-for-good-research-lab/)
- [azure ai](https://learn.microsoft.com/en-us/azure/well-architected/ai/get-started)
- [ai skills](https://www.microsoft.com/en-us/corporate-responsibility/ai-skils-resources)
  - [design-methodology](https://learn.microsoft.com/en-us/azure/well-architected/ai/desgn-methodology)
  - [principles](https://learn.microsoft.com/en-us/azure/well-architected/ai/design-principles)
```

### Results

Links fixed. I'm not entirely sure it was the hook, but ran `copilot`, pasted prompt, and results were as expected. To confirm ran:

```batch
pwsh .github/hooks/fix-broken-links/link-fix.ps1 index.html

  Checking 5 link(s) in index.html ...

  No broken links found.
```
<!-- formatter_2 -->