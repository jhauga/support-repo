# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/1838)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/instruction-exclude-prompt-data/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new instruction `exclude-prompt-data`. Prevents updates to
documentation, code comments, etc. from having prompt `todos` or data more
suitable for the agent's response being thrown in with the data being updated.

- **Agent**: Local
- **Model**: Claude Sonnet 4.6
  - **Thinking Effort**: High
- **Number of Prompts**: 1
- **Post Edits**: None

### Prompt

```bash
Follow instructions `exclude-prompt-data`, and create a shortstory about a
command-line tool called musical. It wants to be a musical, but meets stage the
command-line tool that wants to be a play. Call it `cmd-musical-stage.md`. The
sequence of events should be like:

## cmd-musical.md

    ```md

    # title

    `musical's` Story - 2 to 3 sentences

    ## meet title

    `musical` meets `staged` - 1 to 2 senences

    ### stages story title

    `stage's` story - 2 to 3 sentences

    ## ending title

    2 to 3 sentences and suprise me
    ```

Use an AJAX call in #file:index.html to parse the story.
Add a button at bottom that creates and animates the story, adding
documentation for the button as comments in a creative way where
the story is implementetd.
```

### Results

Good. Mainly I was looking for changes to:

- `# Title`
- `## meet Title`
- `## stages Story Title`
- `## ending Title`

preserved the markdown codeblocks in the story, and the comments for the button
that did not echo or reiterate prompt todos in the comments.

<!-- formatter_2 -->