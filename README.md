# Support Repo - Control Branch

Control branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request #592](https://github.com/github/awesome-copilot/pull/592).
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/negative-legacy-circuit-mockups/index.html)
- `Ctrl + click` [**Positive Test Branch**](https://github.com/jhauga/support-repo/tree/legacy-circuit-mockups?tab=readme-ov-file)

The results from this branch did not use the skill, but kept the reference files for the initial prompt.

## Initial Prompt

<details>

<summary>Full Prompt</summary>

## Core Requirements

### 1. Breadboard & Circuit Simulation
- Render a **realistic solderless breadboard** using HTML5 Canvas
- Enforce correct breadboard rules:
  - Power rails
  - Row/column continuity
  - Center trench separation
- Allow placement, movement, and wiring of components
- Support wire color conventions (power, ground, address bus, data bus, control lines)

### 2. Supported Components (Must Be Fully Functional)
- **W65C02S CPU**
- **W65C22 / 6522 VIA**
- **AT28C256 EEPROM**
- **AS6C62256 SRAM**
- **7400-series logic chips** (address decoding)
- **DFRobot FIT0127 (HD44780-compatible LCD)**
- LEDs, resistors, capacitors, crystals, switches, buttons

Component behavior must follow:
- Electrical rules (tri-state, bus contention)
- Timing and control logic
- Reset and power-up states

Use the following specifications as authoritative behavior contracts:
- `references/emulator-6502.md`
- `references/emulator-6522.md`
- `references/emulator-28256-eeprom.md`
- `references/emulator-6C62256.md`
- `references/emulator-lcd.md`

---

## 3. CPU, Memory, and Bus Emulation
- Implement a **shared address/data bus**
- Correctly emulate:
  - Read/write cycles
  - Address decoding
  - ROM vs RAM access
- EEPROM must:
  - Load ROM images
  - Respect write-protect behavior
- SRAM must:
  - Behave as volatile memory
- VIA must:
  - Drive I/O pins
  - Generate interrupts
  - Control peripherals (LEDs, LCD)

All behavior must align with:
- `references/6502.md`
- `references/6522.md`
- `references/28256-eeprom.md`
- `references/6C62256.md`

---

## 4. Assembly Language Toolchain (Smoke & Mirrors Editor)
Provide an **embedded development environment**:

### Text Editor
- A lightweight “smoke and mirrors” code editor
- Syntax highlighting for 6502 assembly
- Supports labels, directives, comments
- Editable ROM source code

Assembly rules per:
- `references/assembly-language.md`
- `references/assembly-compiler.md`

### Compiler
- Assemble 6502 source code into a ROM image
- Place vectors correctly (`$FFFA–$FFFF`)
- Target AT28C256 memory layout
- Report syntax and linking errors

### Upload Mechanism
- Upload compiled ROM into simulated EEPROM
- Trigger reset to execute new firmware

---

## 5. Terminal & Console Outputs
Include **two distinct consoles**:

### System Terminal
- Shows:
  - Assembly/compile output
  - ROM load status
  - Reset and execution messages

### Runtime Console
- Displays:
  - Debug output
  - VIA register activity
  - Memory reads/writes
  - Optional CPU trace (PC, opcode)

---

## 6. Visual Output Devices
### LEDs
- LEDs must physically light based on:
  - VIA pin output
  - Current direction
  - Correct resistor usage

### LCD (FIT0127)
- Must emulate HD44780 behavior:
  - DDRAM and CGRAM
  - Cursor movement
  - Clear/home commands
- LCD content must change **only** via proper firmware writes

Specification source:
- `references/lcd.md`
- `references/emulator-lcd.md`

---

## 7. Interaction & Simulation Control
- Buttons for:
  - Power on/off
  - Reset
  - Single-step CPU
  - Run / Pause
- Clock speed control
- Optional cycle-accurate stepping

---

## 8. Build Scenarios (Must Be Possible)
Using the simulator and compiler, the user must be able to:
- Blink LEDs using VIA output ports
- Display text on the LCD from assembly code
- Change LCD output dynamically
- Test reset behavior
- Debug wiring mistakes visually
- Observe real-world-style failure modes

---

## 9. Faithfulness Over Convenience
This simulator must **prioritize realism**:
- No magical connections
- No implicit wiring
- No skipping initialization steps
- If firmware is wrong, hardware should fail visibly

---

## References (Authoritative)
All behavior must conform to the following specs:
- `references/6502.md`
- `references/6522.md`
- `references/28256-eeprom.md`
- `references/6C62256.md`
- `references/7400-series.md`
- `references/breadboard.md`
- `references/common-breadboard-components.md`
- `references/basic-electronic-components.md`
- `references/assembly-language.md`
- `references/assembly-compiler.md`
- `references/emulator-6502.md`
- `references/emulator-6522.md`
- `references/emulator-28256-eeprom.md`
- `references/emulator-6C62256.md`
- `references/emulator-lcd.md`
- `references/lcd.md`
- `references/minipro.md`
- `references/t48eeprom-programmer.md`

---

## Final Goal
Produce a **complete virtual retro computer lab** where:
- Hardware is wired visually
- Software is written in real 6502 assembly
- ROMs are compiled and flashed
- LEDs blink
- LCDs display text
- Behavior matches physical breadboard builds

This system should feel indistinguishable from building and debugging a real 6502 computer on a desk.

Create the **final goal** in #file:index.html 
</details>
