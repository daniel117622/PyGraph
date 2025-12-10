import * as vscode from "vscode";

export type NodeType = "function" | "exception" | "method";

export class CallTreeItem extends vscode.TreeItem
{
    children?: CallTreeItem[];
    functionText: string;
    nodeType: NodeType;

    constructor(
        functionText: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        children?: CallTreeItem[],
        nodeType: NodeType = "function"
    )
    {
        super(functionText, collapsibleState);
        this.functionText = functionText;
        this.nodeType = nodeType;
        this.children = children;
    }

    getChildren(): CallTreeItem[]
    {
        return this.children ?? [];
    }
}

export class CallTreeProvider implements vscode.TreeDataProvider<CallTreeItem>
{
    private _onDidChangeTreeData: vscode.EventEmitter<CallTreeItem | undefined>;
    readonly onDidChangeTreeData: vscode.Event<CallTreeItem | undefined>;
    private root: CallTreeItem | null;
    private extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri)
    {
        this._onDidChangeTreeData =
            new vscode.EventEmitter<CallTreeItem | undefined>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.root = null;
        this.extensionUri = extensionUri;
    }

    refresh(): void
    {
        this._onDidChangeTreeData.fire(undefined);
    }

    setCallTree(tree: CallTreeItem): void
    {
        this.root = tree;
        this.refresh();
    }

    getTreeItem(element: CallTreeItem): vscode.TreeItem
    {
        return new vscode.TreeItem(element.functionText, element.collapsibleState);
    }

    getChildren(element?: CallTreeItem): vscode.ProviderResult<CallTreeItem[]>
    {
        if (!this.root)
        {
            return [];
        }
        if (!element)
        {
            return [this.root];
        }
        return element.children || [];
    }
}