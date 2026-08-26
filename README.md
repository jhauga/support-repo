# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request 2806](https://github.com/github/awesome-copilot/pull/2806)
<!-- formatter_1 -->
Canvas extension where Copilot tutors the user on code changes so that they can
understand the updates applied to the codebase.

## Test Conditions

### Evaluation Context

- **Session Target**: GitHub Copilot
- **Agent**: Default Agent
- **Model**: Claude Sonnet 4.6
- **Number of Prompts**: 1
- **Post Edits**: None
<!-- NOTE: change if updated -->
### Copilot Pro+ Plan Credit Usage

- **Start Credits**: 77%
- **End Credits**: 83%

### Prompt

```bash
Make a patch update for the "Runway Landing" game mode. The runway is not
rendering. Start first level off with runway within a reasonable view of the 
ircraft. Start an edit tutorial for the update.
```

### Results

Good. The patch to the repo
[pilot-matter](https://github.com/isocialPractice/pilot-matter) worked. It got
creative with the test, making math variations.

Below are screenshots of the tutorial it gave me.

> [!NOTE]
> The images were resized, so slightly distorted; in order for each screenshot
> to fit on the same composition.

![test results demo](test.gif)
<!-- formatter_2 -->