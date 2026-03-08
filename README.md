# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/924)
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/itWorked/index.html)


<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new html-coder skill.

- **Agent**: Local
- **Model**: Claude Sonnet 4.5
- **Number of Prompts**:
- **Post Edits**: 1
  - Added `<link href="favicon.png" rel="icon">`

### Prompt

```bash
html-coder --new-app video-share 
           --create index.html 
           --base-on youtube.com 
           --hover-preview svg-animation 
           --click-video dynamic-update 
           --on-play svg-animation 
           --svg-animation use-random-algorithm 
           --site-host "GitHub Pages" 
--production-tools=false --development-tools=true
```

### Results

Good and in the context of writing html. The development tool was taken literally, with a make-shift event logger at the bottom of the page.
<!-- formatter_2 -->