# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/1705)

- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-rhino3d-scripts/index.html)

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new skill rhino3d-scripts.

- **Agent**: Local
- **Model**: Claude Opus 4.7
- **Number of Prompts**: 1
- **Post Edits**: Yes

### Prompt

<details>

<summary>Show Details</summary>

```bash
rhino3d-scripts Model a file that will be 3d printed. The elements are:

     ```JSON
     "Unit": "inch",
     "Model": {
      "parts": {[
       "Post Process": {
        "Perform": true,
        "Command": "BooleanUnion"
       },
      "Shapes": {[
       "Cylinder": {
        "id": "Base cylinder",
        "parts": {[
         "Post Process": {
          "Perform": true,
          "Command": "BooleanDifference"
         },
         "Curves": {[
          "circle": {
           "id": "Outer circle",
           "orientation": "y",
           "center": {
            "x-axis": 0,
            "y-axis": 0,
            "z-axis": 0
           },
           "Type": "outer",
           "Draw from": "center",
           "Diameter":  1,
           "Offset curve": false,
           "Extrusion": 0.125
          },
          "circle": {
           "id": "Inner circle",
           "orientation": "y",
           "center": {
            "x-axis": 0,
            "y-axis": 0,
            "z-axis": 0
           },
           "Type": "inner",
           "Draw from": "center",
           "Diameter": 0.625,
           "Offset curve": true,
           "Offset": {
            "direction": "y-axis",
            "distance": -0.1
           },
           "Extrusion": 0.15
          }
         ]},
         "Post Process Commands": {
          "command": {
           "name": "BoolenDifference",
           "parts": {
            "Shape to keep": "Outer circle",
            "Shape to subtract with": "Inner circle"
           }
          }
         }
        ]}
       },
       "Cylinder": {
        "id": "Bottom cylinder",
        "parts": {[
         "Post Process": {
          "Perform": true,
          "Command": "BooleanDifference"
         },
         "Curves": {[
          "circle": {
           "id": "Cap circle",
           "orientation": "y",
           "center": {
            "x-axis": 0,
            "y-axis": 0,
            "z-axis": 6
           },
           "Type": "outer",
           "Draw from": "center",
           "Diameter": 0.625,
           "Offset curve": true,
           "Offset": {
            "direction": "y-axis",
            "distance": -0.1
           },
           "Extrusion": -6
          },
          "rectangle": {
           "id": "Halve cap circle",
           "orientation": "y",
           "center": {
            "x-axis": 0.3125,
            "y-axis": 0,
            "z-axis": 5.9
           },
           "Type": "outer",
           "Draw from": "center",
           "width": .625,
           "height": .625,
           "Offset curve": false,
           "extrude": -5.8
          }
         ]},
         "Post Process Commands": {
          "command": {
           "name": "BoolenDifference",
           "parts": {
            "Shape to keep": "Cap circle",
            "Shape to subtract with": "Halve cap circle"
           }
          }
         }
        ]}
       }
      ]},
      "Post Process Commands": {
       "command": {
        "name": "BoolenUnion",
        "parts": {
         "join": ["Bottom cylinder", "Base cylinder"]
        }
       }
      }
     }
     ```
```

</details>

### Results

Good. Not perfectly what I was looking for; and there was one thing I forgot to include, and another I was incorrect on. The script generated from the prompt missed one thing.

#### Flaws from the Prompt

- I forgot to include the `fillet` to remove the sharp corner left over from the rectangle
- I incorrectly specified the extrusion direction of the inner-base circle, which was meant to substract concentrically from the thin base cylinder

#### Flaw from the Script

- The cap and base cylinders were not concentric

For both of those flaws on my part, and the one miss generated from the script I did post edits. See [index.html](https://jhauga.github.io/support-repo/) for a side-by-side comparision.

- `generated.stl` is what the script made fromt the prompt
  - Green Model
- `post-process.st` is what I wanted to get
  - Gray Model

<!-- formatter_2 -->
