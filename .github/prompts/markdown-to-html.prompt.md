---
agent: 'agent'
description: 'Create a markdown-to-html converter script with support for style comments that apply attributes to generated HTML elements.'
tools: ['edit/editFiles', 'web/fetch']
---

# Markdown to HTML

Create a script in `index.html` that converts markdown to HTML using the skills and references provided.

## Resources

- **Skill**: [SKILL.md](/.github/skills/markdown-to-html/SKILL.md)
- **References**: [references/](/.github/skills/markdown-to-html/references/)

## Core Feature

Implement a custom feature that parses HTML-style comments containing `style` attributes and applies them to generated HTML elements:

- **Comment below markdown**: Apply styles to the HTML tag generated from the preceding markdown.
- **Comment above markdown**: Apply styles to the parent tag that wraps the generated HTML.

## Optional Tasks

If additional instructions or data accompany this prompt, use them to customize the markdown-to-html converter.
