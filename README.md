# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View instruction assets resized [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-adobe-illustrator-scripting/index.html)

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill adobe-illustrator-scripting.

- **Agent**: Local
- **Model**: GPT-5.4
- **Number of Prompts**: 4
- **Thinking Speed**
  - **Prompt 1 to 3**: Medium
  - **Prompt 4**: xhigh
- **Post Edits**: None

### Prompt

### Initial Prompt

```md
adobe-illustrator-scripting Create a script that will:

1. Select the top-most nested element layer in the "Screenshots" layer
2. Scale the selection proportionally, but set the widht to 360px
3. Determine Artboard action by:
  - If the selection is within the boundaries of an artboard, then:
    - Resize the Artboard to the selection
  - Else:
    - Create a new Artboard
    - Navigate to new Artboard
    - Resize the Artboard to the selection
4. Conditional Step
  - If a nested element layer exist below the current selection, then:
    - Select next nested element layer below the current selection
    - Repeat steps 2 through 4 (*this step*)
  - Else:
    - Throw as "Script Complete" alert, and done

Call it - "image-sizing.jsx"
```

### Post Prompts

All post prompts were essentially:

```md
Ran #file:image-sizing.jsx and got:

     ```
     No nested element layers with artwork were found in "Screenshots"
     ```

There are nested layers, items, images, groups, etc. in "Screenshots".
"Screenshots" is the top most layer, and is organized like:

     ```
     - Screenshots
       - `<Image>`
       - `<Image>`
       - `<Image>`
       - `<Group>`
       - `<Image>`
       - `<Image>`
       - `<Group>`
       - etc...
     ```
```

### Results

It worked. I can't exactly illustrate with an Illustrator file, but the
script helped me size the images for the insturctions included in [`file.md`](https://github.com/jhauga/support-repo/blob/skill-adobe-illustrator-scripting/file.md),
of the support repo.

Good because - apart from making the Illustrator scripting skill and script,
this would have taken me like 5 to 10 minutes to do. Now it is done in
5 to 10 seconds.
<!-- formatter_2 -->
