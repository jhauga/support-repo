# Support Repo

Support branch of repository for:
<!-- Link to PR -->
- [negative-markdown-to-html pull request](https://github.com/). <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/negative-markdown-to-html/index.html)

Results from not using the skill file, but all other Copilot elements from the PR. Mainly the intial prompt and prompt filed did not imply `Use your #file:SKILL.md of converting markdown to html`.

- **Agent Model**: Claude Opus 4.5
- **Prompts**: 2

```bash
/markdown-to-html Create index.html and add an AJAX script that will
convert markdown to html with an additional custom feature of applying
the attribute in adjacent comments with valid html attribute syntax to
the parsed html. For example:

## At the end of a line:

    ```markdown
    # Heading 1<!-- style="color:blue" -->
    ```

Parsed as HTML:

    ```html
    <h1 style="color:blue">Heading 1</h1>
    ```

## Before a markdown line:

    ```markdown
    <!-- style="list-style-type: square" -->
    - List item 1
    - List item 2
    ```

Parsed as HTML:

    ```html
    <ul style="list-style-type: square">
     <li>List item 1</li>
     <li>List item 2</li>
    </ul>
    ```

## Within a markdown line:

    ```markdown
    - [ ] <!-- style="display: none" --> A todo item
    ```

Parsed as HTML:

    ```html
    <ul>
     <li><input type="checkbox" style="display: none">  A todo item</li>
    </ul>
    ```

## In a fenced code block:

    ```markdown
      ```
      # Heading 1<!-- style="color:blue" -->
      ```
    ```

Parsed as HTML:

    ```html
    <pre>
     <code># Heading 1<!-- style="color:blue" --></code>
    </pre>
    ```

**IMPORTANT** - see how the raw data is preserved when in fenced code
block in parsed HTML.

# GOAL

Create an `index.html` file that uses an AJAX call, getting the file #file:file.md , then convert the markdown data to HTML. BE SURE to see:

- #file:basic-markdown-to-html.md 
- #file:basic-markdown.md 
- #file:code-blocks-to-html.md 
- #file:code-blocks.md 
- #file:collapsed-sections-to-html.md 
- #file:collapsed.md 
- #file:tables-to-html.md 
- #file:tables.md 
- #file:writing-mathematical-expressions-to-html.md 
- #file:writing-mathematical.md 

for how the data should be converted to HTML from Markdown. And REMEMBER
keep the raw data from the markdown in fenced code blocks preserved. So:

    ```markdown
    # Heading 1<!-- style="border: 1px solid black" -->
    ## Heading 2<!-- style="color: purple" -->
    ### Heading 3<!-- style="border-top: 1px solid black" -->
    #### Heading 4<!-- style="color: blue" -->
    ##### Heading 5<!-- style="border-bottom: 1px solid black" -->
    ###### Heading 6<!-- style="color: green" -->
    ```

Parses HTML as:

    ```html
    <pre><code>
    # Heading 1<!-- style="border: 1px solid black" -->
    ## Heading 2<!-- style="color: purple" -->
    ### Heading 3<!-- style="border-top: 1px solid black" -->
    #### Heading 4<!-- style="color: blue" -->
    ##### Heading 5<!-- style="border-bottom: 1px solid black" -->
    ###### Heading 6<!-- style="color: green" -->
    </code></pre>
    ```

And NOT converting the raw data in markdown code blocks to html and DO NOT
apply custom feature.

**NOTE** - rememeber to correctly convert markdown math expressions to
properly formatted HTML. See #file:writing-mathematical-expressions.md
and #file:writing-mathematical-expressions-to-html.md
```
