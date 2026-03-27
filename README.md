# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->

To see results, create a Codespace and run `python versal.py NewYork-NewYork.txt`.

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support for new instructions.

- **Agent**: Local
- **Model**: GPT-5.4
- **Number of Prompts**: 1
- **Post Edits**: none

### Prompt

```text
Make a command-line tool that will stylistically output the content of a data
file. Call it `versal.py`. Use python. The main goal is for every new
paragraph, or section of data following a blank line, then the first character
should be Versal or a sytled raised capital. For example, using the file
"NewYork-NewYork.txt" and looking at the first two paragraphs of the story; the
Versal output would be like:

     ```bash
     |\=======/|
     ||  ---  ||  
     || || |\ ||
     || || || || 
     || || || ||
     ||  ---  ||
     |/=======\|pening Scene: "New York, New York"
     As the young man prepares ...

     ||\======/|
     ||  ==== ||  
     || ||    ||
     ||   ==  || 
     ||     | ||
     || ===== ||
     |/=======\|cene 1: "Luck Be a Lady"
     The young man arrives in ...

     ```

Create the command-line patterns for the Versal characters, and provide several
options for customizing the character. For example

     ```bash
     versal --no-border file.ext
     ```

Create documentation file called `versal.md` with:

- Install instructions
- List of options
- Use examples
- License MIT
```

### Results

Good. A fun little command-line tool that does versal lettering, and used cliche data for documentation.
<!-- formatter_2 -->
