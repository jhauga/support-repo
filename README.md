# Support Repo

Support branch of repository for:
<!-- Link to PR -->
- [github/awesome-copilot pull request](https://github.com/). <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-game-engine/index.html)
-->

<!--
Test Results:

![demo.gif](/demo.gif)
 -->

Supprot repo for new skill `game-engine` with test results.

- **Agent**: Claude Agent
- **Model**: Claude Sonnet 4.6
- **Number of Prompts**: 1
- **Post Edits**: none

### Prompt

```text
Use #file:SKILL.md to create a 2d beat-em-up similar to the classic arcade game
"Double Dragon" with:

- 1 level
- 3 types of enemies spawned
- 2 intermediate bosses spawining mid-level at the same time
- 1 main boss at the end of the level

Use `svg` graphics to create the assets. Use cliche or common or typical graphics in
regards to:

- Player design, actions and attacks, and movements
- Enemy design, actions and attacks, and movements
- Level design and environmental effects

Map controls as:

- Left arrow = move left
- Right arrow = move right
- Up arrow = move up
- Down arrow = move down
- Space bar = pause
- A = jump
- S = punch

Write the new game to #file:index.html, filling the blank file with the HTML,
CSS, and JavaScript for the game. Choose best JavaScript library available to
run the game using GitHub pages.
```

### Results

After first promp, a woring game.
