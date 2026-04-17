# Support Repo

<!-- Constants -->
<!-- Support branch of repository for: -->
<!-- Link to PR -->
<!-- - [support-repo pull request](https://github.com/)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/) -->
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/it-worked/index.html)
-->

<!--
Test Results:

![demo.gif](/demo.gif)
 -->
Branch used on an as needed basis to validate stuff before creating new branch to support a PR.

## Install Wine Instructions

Follow instructions, or run `bash ./install-wine.sh`.

### 1. WinHQ repository

```bash
sudo mkdir -pm755 /etc/apt/keyrings
wget -O - https://dl.winehq.org/wine-builds/winehq.key | sudo gpg --dearmor -o /etc/apt/keyrings/winehq-archive.key -
```

### 2. Noble (*assuming as GitHub codespace*)

```bash
sudo dpkg --add-architecture i386
sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/noble/winehq-noble.sources
```

### 3. Update and Install Wine

```bash
sudo apt update
sudo apt install --install-recommends winehq-stable
```

### 4. Start DOS Shell

```bash
wine cmd
```

### 5. Run Batch Script

```batch
call itWorked.bat
```
