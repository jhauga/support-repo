# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request 2791](https://github.com/github/awesome-copilot/pull/2791)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-rhino3d-plugins/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill rhino3d-plugins.

## Test Conditions

### Evaluation Context

- **Session Target**: Local
- **Agent**: Agent
- **Model**: Claude Sonnet 4.5
- **Number of Prompts**: 2
- **Post Edits**: none
<!-- NOTE: change if updated -->
### Copilot Pro+ Plan Credit Usage

- **Start Credits**: 64%
- **End Credits**: 68%

### Prompt

#### I

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

#### II

```bash
Resolve:

     ```batch
     dotnet build -c Release
     Restore complete (0.6s)
       WebViewPrep failed with 1 error(s) (1.0s)
         D:\Users\user\support-repo\webview-prep\WebViewPrepPlugIn.cs(46,43): error CS0507: 'WebViewPrepPlugIn.LoadTime': cannot change access modifiers when overriding 'public' inherited member 'PlugIn.LoadTime'

     Build failed with 1 error(s) in 1.8s
     ```
```

Accounted for the error in the skill, updating it.

### III

```md
The plugin works, but there are 2 issues:

**Issue 1**:

2 file extension are not exporting:

- STL: Terminal retturns "Failed to export model"
- GLB: Terminal retturns "Failed to export model"

**Issue 2**:

**Toggle Info** removes the data from the panel. The data is initially there though.
```

Accounted for the issues in the skill, updating it.

### Results

The plugin worked as intended.
<!-- formatter_2 -->