import * as vscode from "vscode";
import { CallTreeItem } from "./dataModel";

export class CallGraphVisitor
{
    public defs: Record<string, any>;
    public calls: Map<string, Set<string>>;
    private current: string[];

    constructor()
    {
        this.defs = {};
        this.calls = new Map<string, Set<string>>();
        this.current = [];
    }

    visit(node: any): void
    {
        if (!node || typeof node !== "object")
        {
            return;
        }

        // Try both formats: Filbert uses "FunctionDeclaration"
        const type = node.type;
        const methodName = `visit_${type}`;

        if ((this as any)[methodName])
        {
            (this as any)[methodName](node);
        }
        else
        {
            this.generic_visit(node);
        }
    }

    generic_visit(node: any): void
    {
        for (const key in node)
        {
            if (key === "parent")
            {
                continue;
            }
            const child = node[key];
            if (Array.isArray(child))
            {
                for (const c of child)
                {
                    this.visit(c);
                }
            }
            else if (typeof child === "object" && child !== null && child.type)
            {
                this.visit(child);
            }
        }
    }

    // Filbert: FunctionDeclaration = function definition
    visit_FunctionDeclaration(node: any): void
    {
        if (node.id && node.id.name)
        {
            const name = node.id.name;
            this.defs[name] = node;
            this.current.push(name);
            this.generic_visit(node);
            this.current.pop();
        }
    }

    // Filbert: CallExpression = function call
    visit_CallExpression(node: any): void
    {
        if (this.current.length > 0)
        {
            let funcName: string | null = null;
            if (node.callee)
            {
                if (node.callee.type === "Identifier")
                {
                    funcName = node.callee.name;
                }
                else if (
                    node.callee.type === "MemberExpression" &&
                    node.callee.property &&
                    node.callee.property.type === "Identifier"
                )
                {
                    funcName = node.callee.property.name;
                }
            }

            if (funcName)
            {
                const caller = this.current[this.current.length - 1];
                if (!this.calls.has(caller))
                {
                    this.calls.set(caller, new Set<string>());
                }
                this.calls.get(caller)!.add(funcName);
            }
        }

        this.generic_visit(node);
    }
}

export function buildTree(
    funcName: string,
    calls: Map<string, Set<string>>,
    defs: Record<string, any>,
    seen: Set<string> = new Set()
): CallTreeItem
{
    const childrenNodes: CallTreeItem[] = [];

    if (seen.has(funcName))
    {
        const displayName = `${funcName} (recursive)`;
        return new CallTreeItem(
            displayName,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            "function"
        );
    }

    const newSeen = new Set(seen);
    newSeen.add(funcName);

    const callees = Array.from(calls.get(funcName) || []);

    // Sort by type: internal first, external second, then alphabetically
    callees.sort((a, b) =>
    {
        const aInternal = defs[a] ? 0 : 1;
        const bInternal = defs[b] ? 0 : 1;

        if (aInternal !== bInternal)
        {
            return aInternal - bInternal;
        }

        return a.localeCompare(b);
    });

    for (const callee of callees)
    {
        if (defs[callee])
        {
            // internal, has defined body
            childrenNodes.push(buildTree(callee, calls, defs, newSeen));
        }
        else
        {
            // external call / library function
            childrenNodes.push(
                new CallTreeItem(
                    `→ ${callee}`,
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    "method"
                )
            );
        }
    }

    const collapsibleState =
        childrenNodes.length > 0
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

    return new CallTreeItem(
        funcName,
        collapsibleState,
        childrenNodes,
        "function"
    );
}