# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-rhino3d-plugins/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill rhino3d-plugins.

## Test Conditions

- **Agent**: Local
- **Model**: Claude Sonnet 4.5
- **Number of Prompts**: 1
- **Post Edits**: none
<!-- NOTE: change if updated -->
### Copilot Pro+ Plan Credit Usage

- **Start Credits**: 64%
- **End Credits**:

### Prompt

```bash
/rhino3d-plugins --new-plugin webview-prep 
                 --plugin-does generate-webpage-for-open-rhion-model --utilize-localhost-preview=true 
                 --plugin-is-panel=true --plugin-has-preview-view=false --preview-method button.text("Open Preview in Browser")
                 --allow-external-libraries-for-web-view=true --proposed-library `three.js`
                 --exportable-as-html=true --proposed-export-method button.text("Export as HTML");
                 --initial-panel-ui button.text("Generate Web Page for Model")
                 --generated-page-maintains-model start-list:
                 ```
                  - layers
                  - materials
                  - dimensions
                 ```
                 end-list
                 --generating-page-steps start-steps:
                 ```
                 - "Generate Web Preview Page" is clicked
                 - Export as STL (default type)
                   - Configurable: true
                 - Generate webpage
                 - Display "Open Preview in Browser", "Export as HTML", and "Cancel" (ends local host task) buttons
                 ```
                 end-steps
```

### Results

AS_NEEDED
<!-- formatter_2 -->