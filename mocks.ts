import * as vscode from "vscode";

import {CallTreeItem, NodeType} from "./dataModel"

export function createMockTree(rootName : string, sourceCode : string): CallTreeItem
{
    const lineCount = sourceCode.split(/\r\n|\r|\n/).length;
    const displayName = rootName + " (" + lineCount + " lines)";

    return new CallTreeItem(
        displayName,
        vscode.TreeItemCollapsibleState.Expanded,
        [
            new CallTreeItem(
                "_get_device_data",
                vscode.TreeItemCollapsibleState.Collapsed,
                [
                    new CallTreeItem("-> _handle_exception", vscode.TreeItemCollapsibleState.None, undefined, "exception"),
                    new CallTreeItem("-> get", vscode.TreeItemCollapsibleState.None),
                    new CallTreeItem("-> info", vscode.TreeItemCollapsibleState.None),
                    new CallTreeItem("-> json", vscode.TreeItemCollapsibleState.None)
                ]
            ),
            new CallTreeItem(
                "_get_id_user",
                vscode.TreeItemCollapsibleState.Collapsed,
                [
                    new CallTreeItem("-> _handle_exception", vscode.TreeItemCollapsibleState.None, undefined, "exception"),
                    new CallTreeItem("-> find_element", vscode.TreeItemCollapsibleState.None),
                    new CallTreeItem("-> get_attribute", vscode.TreeItemCollapsibleState.None),
                    new CallTreeItem("-> wait_for_visibility", vscode.TreeItemCollapsibleState.None)
                ]
            ),
            new CallTreeItem(
                "_share_cookies_to_requests",
                vscode.TreeItemCollapsibleState.Collapsed,
                [
                    new CallTreeItem("-> get_cookies", vscode.TreeItemCollapsibleState.None),
                    new CallTreeItem("-> set", vscode.TreeItemCollapsibleState.None)
                ]
            ),
            new CallTreeItem("-> append", vscode.TreeItemCollapsibleState.None),
            new CallTreeItem(
                "extract_info",
                vscode.TreeItemCollapsibleState.Collapsed,
                [
                    new CallTreeItem(
                        "_create_gps_data",
                        vscode.TreeItemCollapsibleState.Collapsed,
                        [
                            new CallTreeItem("-> _convert_datetime_format", vscode.TreeItemCollapsibleState.None),
                            new CallTreeItem(
                                "_dummy_device_data",
                                vscode.TreeItemCollapsibleState.Collapsed,
                                [
                                    new CallTreeItem("-> _convert_datetime_format", vscode.TreeItemCollapsibleState.None),
                                    new CallTreeItem("-> format_device_str", vscode.TreeItemCollapsibleState.None)
                                ]
                            ),
                            new CallTreeItem("-> _evaluated_field", vscode.TreeItemCollapsibleState.None),
                            new CallTreeItem("-> float", vscode.TreeItemCollapsibleState.None),
                            new CallTreeItem("-> format_device_str", vscode.TreeItemCollapsibleState.None),
                            new CallTreeItem("-> get", vscode.TreeItemCollapsibleState.None),
                            new CallTreeItem("-> int", vscode.TreeItemCollapsibleState.None)
                        ]
                    ),
                    new CallTreeItem("-> append", vscode.TreeItemCollapsibleState.None)
                ]
            ),
            new CallTreeItem("-> find_elements", vscode.TreeItemCollapsibleState.None),
            new CallTreeItem("-> get_attribute", vscode.TreeItemCollapsibleState.None),
            new CallTreeItem("-> info", vscode.TreeItemCollapsibleState.None),
            new CallTreeItem("-> time", vscode.TreeItemCollapsibleState.None)
        ]
    );
}