# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-multi-lang-coder/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill multi-lang-coder.

- **Agent**: Local
- **Model**: GPT-5.4 - Xhigh
- **Number of Prompts**: 0
- **Post Edits**: None

### Prompt

I filled [`index.html`](index.original.html) (*link is to `index.original.html`) with the polygot code needed for the prompt, then ran:

```bash
multi-lang-coder #index.html

context = The page will be hosted on GitHub Pages, and built from action `.github/workflows/deploy.yml`.
```

### Results

Great! I mixed-up the code in the script tag, leaving about 25% of it maybe valid JavaScript. The rest a mix of bash, impied Python, and HTML DOM inferences. With that:

- It improved the UI significantly, which at the time of the prompt was - good enough
- The functionality was exactly what I was intending
- The fact that the UI was changed (*improved*) significantly is controversial, but could easliy be resolved with an extra sentence in the prompt
<!-- formatter_2 -->