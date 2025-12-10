# Python Calltree Viewer

**Python Calltree Viewer** is a Visual Studio Code extension that visualizes
static Python call trees for individual functions or methods directly from
your code editor.

---

## Features

- Generates a static call tree for a selected Python function or method.
- Displays the tree structure in a dedicated sidebar view.
- Integrates seamlessly into the VS Code context menu and command palette.
- Runs an external Python analysis script (`parser_script.py`) to extract
  call structure information.

---

## Usage

1. Open a Python file in VS Code.
2. Place the cursor inside a function or method definition.
3. Right-click and select **"Show Python Call Tree"** (second item in the context menu).
4. The call tree will appear in the **Call Tree** panel on the sidebar.

---

## Commands

| Command ID | Description |
|-------------|-------------|
| `pythonCalltree.showCallTree` | Show the call tree for the selected Python function. |

You can also trigger this command using the shortcut:
```Ctrl + Shift + R```

## Configuration

The extension will attempt to use the Python interpreter defined by your VSCode settings.

If you have a specific Python binary configured:

```json

"python.defaultInterpreterPath": "/usr/bin/python3"
```
You can also right click the function to see the call tree directly: 

<img width="1905" height="1081" alt="image" src="https://github.com/user-attachments/assets/3ac937aa-db7f-48b1-9d07-1c4a2e4de65f" />

