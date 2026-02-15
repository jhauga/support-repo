# Support Repo

Support branch of repository for:
<!-- Link to PR -->
- [github/awesome-copilot pull request](https://github.com/). <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-pdftk-server/index.html)
-->

Test for new skill pdftk-server.

- **Agent**: Claude Agent
- **Model**: Claude Sonnet 4.5
- **Files Created**: [fill_pdf_form.bat](fill_pdf_form.bat)

### Prompt

```text
Using your `pdftk-server` #file:SKILL.md create a batch file that will update
#file:testPDF.pdf using `pdftk` and fill the form fields `Quarter` and `Year`
with the current fiscal quarter and year.
```

### Running Script `fill_pdf_form.bat`

I made one change in the batch file, but it was not related to calling `pdftk` which is the focus of the skill. The change was in regards to the `for` loop of the script. The original code produced has been commented out in [fill_pdf_form.bat](fill_pdf_form.bat).

```bash
fill_pdf_form.bat
Fiscal Quarter: Q2
Fiscal Year: 2026

Filling PDF form...

Success C:\Users\johnh\GitHub\support-repo\testPDF_filled.pdf
Press any key to continue . . .

```

## Results

The skill worked. No additional prompts or edits pertaining to the `pdftk` call needed. The orginal PDF `testPDF.pdf` was filled and output to `testPDF_filled.pdf` after running batch script.
