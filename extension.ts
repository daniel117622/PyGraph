import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import { CallTreeItem, CallTreeProvider } from "./dataModel";

const outputChannel = vscode.window.createOutputChannel("Python Call Tree");

function findSymbolOrFallback(
    symbols : vscode.DocumentSymbol[],
    pos     : vscode.Position,
    document: vscode.TextDocument
): vscode.DocumentSymbol | null
{
    const sym = findSymbol(symbols, pos);
    if (sym)
    {
        return sym;
    }

    // fallback: get word under cursor
    const wordRange = document.getWordRangeAtPosition(pos);
    if (wordRange)
    {
        const text = document.getText(wordRange);
        for (const s of symbols)
        {
            if (s.name === text)
            {
                return s;
            }
        }
    }

    return null;
}

function findSymbol(
    symbols: vscode.DocumentSymbol[],
    pos: vscode.Position
): vscode.DocumentSymbol | null
{
    for (const symbol of symbols)
    {
        const sel = symbol.selectionRange;
        const rng = symbol.range;

        const inSel =
            sel &&
            pos.line >= sel.start.line &&
            pos.line <= sel.end.line;

        const inRng =
            pos.line >= rng.start.line &&
            pos.line <= rng.end.line;

        if (inSel || inRng)
        {
            const childHit = findSymbol(symbol.children, pos);
            if (
                childHit &&
                (childHit.kind === vscode.SymbolKind.Function ||
                    childHit.kind === vscode.SymbolKind.Method)
            )
            {
                return childHit;
            }
            return symbol;
        }
    }
    return null;
}

const symbolKindMap: { [key: number]: string } = {
    [vscode.SymbolKind.File]: "File",
    [vscode.SymbolKind.Module]: "Module",
    [vscode.SymbolKind.Namespace]: "Namespace",
    [vscode.SymbolKind.Package]: "Package",
    [vscode.SymbolKind.Class]: "Class",
    [vscode.SymbolKind.Method]: "Method",
    [vscode.SymbolKind.Property]: "Property",
    [vscode.SymbolKind.Field]: "Field",
    [vscode.SymbolKind.Constructor]: "Constructor",
    [vscode.SymbolKind.Enum]: "Enum",
    [vscode.SymbolKind.Interface]: "Interface",
    [vscode.SymbolKind.Function]: "Function",
    [vscode.SymbolKind.Variable]: "Variable",
    [vscode.SymbolKind.Constant]: "Constant",
    [vscode.SymbolKind.String]: "String",
    [vscode.SymbolKind.Number]: "Number",
    [vscode.SymbolKind.Boolean]: "Boolean",
    [vscode.SymbolKind.Array]: "Array",
    [vscode.SymbolKind.Object]: "Object",
    [vscode.SymbolKind.Key]: "Key",
    [vscode.SymbolKind.Null]: "Null",
    [vscode.SymbolKind.EnumMember]: "EnumMember",
    [vscode.SymbolKind.Struct]: "Struct",
    [vscode.SymbolKind.Event]: "Event",
    [vscode.SymbolKind.Operator]: "Operator",
    [vscode.SymbolKind.TypeParameter]: "TypeParameter",
};

function mapJsonToTreeItem(node: any, isRoot = false): CallTreeItem
{
    const hasChildren = node.children && node.children.length > 0;

    // Add max_depth annotation on the root
    const baseLabel = isRoot && node.max_depth
        ? `[${node.max_depth}] : ${node.name}`
        : node.name;

    const label = hasChildren ? baseLabel : `→ ${baseLabel}`;
    const state = hasChildren
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None;

    const item = new CallTreeItem(label, state, []);

    if (hasChildren)
    {
        item.children = node.children.map((child: any) =>
            mapJsonToTreeItem(child)
        );
    }

    return item;
}

export function activate(context: vscode.ExtensionContext)
{
    const provider = new CallTreeProvider(context.extensionUri);

    vscode.window.registerTreeDataProvider("pythonCallTree", provider);

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "pythonCalltree.showCallTree",
            async function ()
            {
                const editor = vscode.window.activeTextEditor;

                if (!editor)
                {
                    return;
                }

                const document = editor.document;
                const position = editor.selection.active;
                // No longer need fileText here as python reads the file directly

                // 1. Get Symbol at Cursor
                const symbols = await vscode.commands.executeCommand<
                    vscode.DocumentSymbol[]
                >("vscode.executeDocumentSymbolProvider", document.uri);

                const symbol = findSymbolOrFallback(
                    symbols || [],
                    position,
                    document
                );

                if (!symbol)
                {
                    const selectedText = document
                        .getText(editor.selection)
                        .trim();

                    vscode.window.showInformationMessage(
                        `No symbol found at cursor location (line ${position.line + 1}, column ${position.character + 1}) — selected text: '${selectedText || "<none>"}'.`
                    );
                    return;
                }

                const kindStr =
                    symbolKindMap[symbol.kind] || symbol.kind.toString();

                if (kindStr === "Method" || kindStr === "Function")
                {
                    provider.setCallTree(
                        new CallTreeItem(
                            "Analyzing...",
                            vscode.TreeItemCollapsibleState.None,
                            []
                        )
                    );

                    const scriptPath = context.asAbsolutePath("parser_script.py");
                    // Ensure you check if user has a custom python path set in settings
                    const pythonPath =
                        vscode.workspace
                            .getConfiguration("python")
                            .get<string>("defaultInterpreterPath") || "python";
                    const args = [scriptPath, document.fileName, symbol.name];

                    cp.execFile(
                        pythonPath,
                        args,
                        { cwd: path.dirname(document.fileName) },
                        (err, stdout, stderr) =>
                        {
                            if (err)
                            {
                                outputChannel.appendLine(`Exec error: ${err}`);
                                outputChannel.appendLine(`Stderr: ${stderr}`);
                                vscode.window.showErrorMessage(
                                    "Failed to run Python parser. Check Output."
                                );
                                return;
                            }

                            try
                            {
                                const data = JSON.parse(stdout);

                                if (data.error)
                                {
                                    vscode.window.showErrorMessage(
                                        `Parser Error: ${data.error}`
                                    );
                                    return;
                                }

                                const rootItem = mapJsonToTreeItem(data, true);
                                provider.setCallTree(rootItem);
                            }
                            catch (parseError)
                            {
                                outputChannel.appendLine(
                                    `JSON Parse error: ${parseError}`
                                );
                                outputChannel.appendLine(`Raw Output: ${stdout}`);
                                vscode.window.showErrorMessage(
                                    "Failed to parse parser output."
                                );
                            }
                        }
                    );
                }
                else
                {
                    vscode.window.showInformationMessage(
                        `Selected symbol '${symbol.name}' is a ${kindStr}, not a Function or Method.`
                    );
                }

                vscode.commands.executeCommand(
                    "workbench.view.extension.pythonCallTreeSidebar"
                );
            }
        )
    );
}

export function deactivate()
{
    outputChannel.appendLine("Extension deactivated");
}