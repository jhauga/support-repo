# Support Repo

Support branch of repository for:
<!-- Link to PR -->
- [github/awesome-copilot pull request](https://github.com/). <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/BRANCH_NAME/index.html) 
-->

Results from using new skill that converts markdown to html with additional custom features. The prompt used utilized the prompt file [markdown-to-html](.github/prompts/markdown-to-html.prompt.md). Two test were performed.

#### Test I

The prompt file was ill-named, being `markdown-to-html`. Test info:

- **Agent Model**: Claude Opus 4.5
- **Prompts**: 7 (*+ or - 1*)
- **File**: `index_i.html`

#### Test II

- **Agent Model**: Claude Opus 4.5
- **Prompts**:
- **File**: `index.html`

##### Test I and II Initial Prompt

```bash
/markdown-to-html Using your #file:SKILL.md of converting markdown to html, create
an AJAX script in index.html that will convert markdown to html with an additional
custom feature of applying comments immediately following the markdown line,
somewhere within the markdown line, or above a new markdown line with the text
`style` in the comment, but with syntax as if an html attribute in the comment;
to the html tag that will be generated from the preceding markdown line, markdown
element if the comment is within the line, and to the parent tag if the comment is
above the markdown i.e. list items. Use the data in the comments that are written
as if html formatted attributes as they are written in the comment to the custom
feature of converting markdown to html. Convert the file #file:file.md to html,
using it in the AJAX call.
```

The starting html was:

```html
<!doctype html>
<html>
<head>
 <meta charset="utf-8">
 <title>Markdown to HTML</title>
 <link rel="icon" href="/favicon.png">
 <link rel="stylesheet" 
 href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css"
 crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>

<body>
 <div id="parseMarkdown"></div>

 <script>
  // embeddedScript
  // Convert markdown to html.
 </script>
</body>
</html>
```
