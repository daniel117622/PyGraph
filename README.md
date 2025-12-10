# Python Calltree Viewer

**Python Calltree Viewer** is a Visual Studio Code extension that visualizes
static Python call trees for individual functions or methods directly from
your code editor.

---
## Local installation 

From the project root directory:

```bash
  npm install
  npm run compile
  npx @vscode/vsce package
```

This generates a `.vsix` file, for example:

Run the following command to install locally:

```bash
  code --install-extension python-calltree-viewer-0.1.0.vsix`
```

## Features

- Generates a static call tree for a selected Python function or method.
- Displays the tree structure in a dedicated sidebar view.

---

## Usage

1. Open a Python file in VS Code.
2. Place the cursor inside a function or method definition.
3. Right-click and select **"Show Python Call Tree"** (second item in the context menu).
4. The call tree will appear in the **Call Tree** panel on the sidebar.
---

## Commands

Use the shortcut:
```Ctrl + Shift + R```

You can also right click the function to see the call tree directly: 

<img width="1905" height="1081" alt="image" src="https://github.com/user-attachments/assets/3ac937aa-db7f-48b1-9d07-1c4a2e4de65f" />

## Configuration

The extension will attempt to use the Python interpreter defined by your VSCode settings.

If you have a specific Python binary configured:

```json

"python.defaultInterpreterPath": "/usr/bin/python3"
```





