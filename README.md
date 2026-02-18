# Support Repo

Support branch of repository for:
<!-- Link to PR -->
- [github/awesome-copilot pull request](https://github.com/). <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->

Support branch for new skill in `github/awesome-copilot` with test results. The reference file `getDate.md` deliberately used Windows DOS option syntax to see if the skill resolved to using "-" prepended options, which no - it did not, but the results were good enough; so I did not do any post-polishing prompts or edits.

- **Agent**: Local Session
- **Model**: GPT-5.3-Codex
- **Files Created**: `getDate.sh`, `getDate.py`, `getDate.c`, `getDate.pl`, `test_getDate_tools.sh`, `GETDATE.md` (***lines created**: this one*)
- **Number of Prompts**: 1
- **Post Edits**: none

### Prompt

```text
quasi-coder --create new-command-line-tool 
            --OS Linux
            --tool-name ["getDate.sh", "getDate.py", "getDate.c", "getDate.pl"] 
            --tool-use #file:getDate.md 
            --follow-best-linux-command-line-tool-practices=true
            --getDate-will-be-run-in "GitHub repository Codespace" --needs-md-documentation-at-root-of-this-repo=true
            --docs-include-install-in-code-base=true
            --install-are-copy-paste-ready=true
            --create-tools-folder=false
            --create-tools-in-root-of-repo=true
            --create-test-for-tools=true code
```

## Results

All but the `C` version of the tool were created without any problems. The `C` version compiled with warning, but still works. The tool itself could probably work as-is as an admin helper script (*or something*). With some polishing, a viable Linux package.

### Results According to `quasi-coder`

> [!NOTE]
> The below list, and another line were added by the agent after the prompt, which I found interesting. I usually start new branches with blank templates, then fill in after the test. This time `quasi-coder` did some of it for me.

- Implemented 4 Linux command-line tools at repo root: shell, python, C, and perl.
- Added shared behavior support for shorthand options, silent mode, leap check, and variable persistence.
- Added root docs in `GETDATE.md` with copy-paste-ready GitHub Codespaces install steps.
- Added cross-tool test suite in `test_getDate_tools.sh`.
- Verified all tests pass in Linux shell (`bash -lc ./test_getDate_tools.sh`).
