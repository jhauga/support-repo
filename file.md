# Markdown Basics & Essentials

This document demonstrates common and essential Markdown syntax, along with a few advanced features.

---

## 1. Headings

```markdown
# Heading 1<!-- style="border: 1px solid black" -->
## Heading 2<!-- style="color: purple" -->
### Heading 3<!-- style="border-top: 1px solid black" -->
#### Heading 4<!-- style="color: blue" -->
##### Heading 5<!-- style="border-bottom: 1px solid black" -->
###### Heading 6<!-- style="color: green" -->
```

Rendered:

# Heading 1<!-- style="border: 1px solid black" -->

## Heading 2<!-- style="color: purple" -->

### Heading 3<!-- style="border-top: 1px solid black" -->

#### Heading 4<!-- style="color: blue" -->

##### Heading 5<!-- style="border-bottom: 1px solid black" -->

###### Heading 6<!-- style="color: green" -->

---

## 2. Emphasis & Text Formatting

```markdown
*Italic* or _Italic_
**Bold** or __Bold__
***Bold & Italic***<!-- style="text-decoration: underline" -->
~~Strikethrough~~
```

Rendered:

*Italic*
**Bold**
***Bold & Italic***<!-- style="text-decoration: underline" -->
~~Strikethrough~~

---

## 3. Lists

### Unordered List

```markdown
<!-- style="list-style-type: square" -->
- Item A
- Item B
  - Nested Item
```

<!-- style="list-style-type: square" -->
* Item A
* Item B

  * Nested Item

### Ordered List

```markdown
1. First
2. Second
3. Third
```

1. First
2. Second
3. Third

---

## 4. Links

```markdown
[OpenAI](https://openai.com)<!-- style="color:darkslategray" -->
```

Rendered:

[OpenAI](https://openai.com)<!-- style="color:darkslategray" -->

---

## 5. Images

```markdown
![Alt text](image.jpg "Optional title")<!-- style="max-width: 300px; min-width: 100px" -->
```

Rendered:

![Placeholder image](image.jpg)<!-- style="max-width: 300px; min-width: 100px" -->

---

## 6. Code Blocks

### Inline Code

```markdown
Use `console.log()` to print output.
```

Rendered:

Use `console.log()` to print output.

### Fenced Code Block

````markdown
    <!-- style="border-left: 3px solid gray" -->
    ```js
    function greet(name) {
      return `Hello, ${name}!`;
    }
    ```
````

Rendered:

<!-- style="border-left: 3px solid gray" -->
```js
function greet(name) {
  return `Hello, ${name}!`;
}
```

---

## 7. Tables

```markdown
| Name  | Language | Level |
|-------|----------|-------|
| Alice | Python   | Advanced |
| Bob   | JavaScript | Intermediate |
```

Rendered:

| Name  | Language   | Level        |
| ----- | ---------- | ------------ |
| Alice | Python     | Advanced     |
| Bob   | JavaScript | Intermediate |

---

## 8. Blockquotes & Alerts

### Blockquote

```markdown
> This is a blockquote.
```

> This is a blockquote.

### Alerts (GitHub-style)

```markdown
> **Note**
> This is an informational alert.

> **Warning**
> Be careful with this action.
```

> **Note**
> This is an informational alert.

> **Warning**
> Be careful with this action.

---

## 9. Horizontal Rules

```markdown
---<!-- style="height: 1px" -->
***<!-- style="height: 5px" -->
___<!-- style="height: 10px" -->
```

---<!-- style="height: 1px" -->
***<!-- style="height: 5px" -->
___<!-- style="height: 10px" -->

## 10. Footnotes

```markdown
This is a sentence with a footnote.[^1]

[^1]: This is the footnote text.
```

Rendered:

This is a sentence with a footnote.[^1]

[^1]: This is the footnote text.

---

## 11. Mathematical Expressions (Advanced)

> Note: Math rendering depends on the platform (GitHub, Markdown + MathJax, etc.)

### Inline Math

```markdown
The equation $a^2 + b^2 = c^2$ is the Pythagorean theorem.
```

Rendered:

The equation $a^2 + b^2 = c^2$ is the Pythagorean theorem.

### Block Math

```markdown
$$
\int_0^\infty e^{-x} dx = 1
$$
```

Rendered:

$$
\int_0^\infty e^{-x} dx = 1
$$

---

## 12. Task Lists

```markdown
- [x]<!-- style="display: none" --> Write documentation
- [ ]<!-- style="display: none" --> Add examples
- [ ]<!-- style="display: none" --> Publish
```

Rendered:

- [x]<!-- style="display: none" --> Write documentation
- [ ]<!-- style="display: none" --> Add examples
- [ ]<!-- style="display: none" --> Publish

---

## 13. Escaping Characters

```markdown
\*This text is not italicized\*
```

Rendered:

*This text is not italicized*

---
