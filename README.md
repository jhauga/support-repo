# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill batch-files.

- **Agent**: Local
- **Model**: Claude Opus 4.6
- **Number of Prompts**: 2
- **Post Edits**: 2
  - Added echo to game over screen `echo Play again? ^(Y/N^)`
  - Added "Q" to choice in game over screen as `choice /c YNQ ..`

### Prompt

```bash
batch-files Create a "Space Invaders" knock-off DOS game - call it
"alien-attackers.bat". It should:

- Use simple controls
  - Left/right arrow, or A/D keys
  - Spacebar shoots
  - "P" to pause
  - "Q" to quit

The tool will be called in an unconventional environment:

- GitHub codespace will be used to launch the initial console
- The Linux tool `wine` will be downloaded so the batch file will be called
  from the `wine` console as `wine cmd alien-attackers.bat`

For more info on the environment, see the wine installation script
`install-wine.sh`.

At the top of the `alien-attackers.bat` file include additional
instructions to:

- Install dependencies (*may be needed - so if dependencies used*)
- Run the game
- Play the game

allowing for a help option like `/?` that will in-turn output the help comments
to the terminal if called like `alien-attackers /?`
```

### Results

After first prompt, progress was made. Things that worked:

- Player moved
- Shoot works
- Shoot removed enemy

But the terminal output "ECHO is off." in the left column, and enemies did not
progress. See details below for initial terminal output:

<details>

<summary>Show Details</summar>

```batch
ECHO is off.
ECHO is off.
        M   M   M   M   M   M   M   M    
        M   M   M   M   M   M   M   M    
        M   M   M   M   M   M   M   M    
        M   M   M   M       M   M   M    
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
ECHO is off.
                        /^\              
 ========================================
 ```
 </details>

 Resolved after second prompt. The third prompt resolved the keypress of "Q" to
 quit the game, which exits to the "Game Over" screen. Applied post edits
 after that. Game works. I mean - its 1960's DOS quality, but still - pure
 batch script "Space Invaders" knock-off.

<!-- formatter_2 -->

### View Results

To see the results follow instructions, or run `bash ./install-wine.sh` in a codespace from this branch.

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
alien-attackers.bat
```
