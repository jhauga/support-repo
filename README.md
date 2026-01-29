# Support Repo

Support branch of repository for:
<!-- Link to PR -->
- [github/awesome-copilot pull request](https://github.com/). <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/BRANCH_NAME/index.html)
-->

Results from using new skill that converts markdown to html with additional custom features. The prompt used utilized the prompt file [markdown-to-html.md](.github/prompts/markdown-to-html.prompt.md).

```yaml
Agent Model: "Claude Sonnet 4.5"
Prompts:
```

```bash
/markdown-to-html Using your #file:SKILL.md  of converting markdown to html,
create index.html and add an AJAX script that will convert markdown to html
with an additional custom feature of applying the attribute in adjacent
comments with valid html attribute syntax to the parsed html. For example:

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
- #file:code-blocks-to-html.md 
- #file:collapsed-sections-to-html.md 
- #file:tables-to-html.md 
- #file:writing-mathematical-expressions-to-html.md 

for how the data should be converted to HTML from Markdown.
```
