import ast
import sys
import json
from collections import defaultdict

class CallGraphVisitor(ast.NodeVisitor):
    def __init__(self):
        self.calls = defaultdict(set)
        self.current = []
        self.class_stack = []

    def visit_ClassDef(self, node):
        self.class_stack.append(node.name)
        self.generic_visit(node)
        self.class_stack.pop()

    def visit_FunctionDef(self, node):
        if self.class_stack:
            func_name = f"{'.'.join(self.class_stack)}.{node.name}"
        else:
            func_name = node.name

        self.current.append(func_name)
        self.generic_visit(node)
        self.current.pop()

    def visit_AsyncFunctionDef(self, node):
        if self.class_stack:
            func_name = f"{'.'.join(self.class_stack)}.{node.name}"
        else:
            func_name = node.name

        self.current.append(func_name)
        self.generic_visit(node)
        self.current.pop()

    def visit_Call(self, node):
        if self.current:
            func_name = None
            if isinstance(node.func, ast.Attribute):
                func_name = node.func.attr
            elif isinstance(node.func, ast.Name):
                func_name = node.func.id

            if func_name:
                self.calls[self.current[-1]].add(func_name)

        self.generic_visit(node)

def resolve_name(target_short_name, all_defined_funcs):
    """
    Tries to find the fully qualified name for a short name.
    e.g. "add" -> "Calculator.add"
    """
    if target_short_name in all_defined_funcs:
        return target_short_name
    
    # Look for exact suffix matches (Method vs Class.Method)
    candidates = [
        f for f in all_defined_funcs 
        if f.endswith(f".{target_short_name}")
    ]
    
    # If exactly one match found, assume that's it
    if len(candidates) == 1:
        return candidates[0]
        
    return target_short_name

def build_tree(func, calls, seen=None):
    if seen is None:
        seen = set()
    
    node = {
        "name": func,
        "children": []
    }
    
    seen.add(func)
    
    # Get all keys to use for resolution
    all_funcs = set(calls.keys())
    
    # Sort for deterministic output
    raw_callees = sorted(list(calls.get(func, [])))
    
    for callee_short in raw_callees:
        # Resolve short name (e.g. "add") to long name ("Calculator.add")
        resolved_callee = resolve_name(callee_short, all_funcs)
        
        if resolved_callee in calls and resolved_callee not in seen:
            node["children"].append(build_tree(resolved_callee, calls, seen.copy()))
        else:
            node["children"].append({"name": callee_short, "children": []})
            
    # Para cada nivel del arbol se ordena de mayor a menor.
    # Se utiliza el numero de hijos.
    node["children"].sort(key=lambda x: len(x["children"]), reverse=True)

    return node

def max_depth(func, calls, seen=None, all_funcs=None):
    if seen is None:
        seen = set()
    if all_funcs is None:
        all_funcs = set(calls.keys())
        
    seen.add(func)
    
    raw_callees = calls.get(func, [])
    
    depths = []
    for callee_short in raw_callees:
        resolved = resolve_name(callee_short, all_funcs)
        
        if resolved in calls and resolved not in seen:
            depths.append(max_depth(resolved, calls, seen.copy(), all_funcs))
            
    if depths:
        return 1 + max(depths)
    return 1

if __name__ == "__main__":
    try:
        if len(sys.argv) < 3:
            sys.exit(1)
            
        file_path = sys.argv[1]
        entry_point = sys.argv[2]

        with open(file_path, "r", encoding="utf-8") as f:
            source = f.read()

        tree = ast.parse(source)
        visitor = CallGraphVisitor()
        visitor.visit(tree)

        # 1. Try to resolve entry point (VS Code sends "add", we have "Calculator.add")
        resolved_entry = resolve_name(entry_point, visitor.calls.keys())

        if resolved_entry not in visitor.calls:
             # Fallback check for functions defined but never calling anything (empty entries)
             # Not strictly needed if visitor populates calls with empty sets, but safer
             found = False
             for k in visitor.calls.keys():
                 if k == resolved_entry: 
                     found = True 
                     break
             
             if not found:
                print(json.dumps({"error": f"Function {entry_point} not found"}))
                sys.exit(0)

        # 2. Build Tree using resolved entry
        result = build_tree(resolved_entry, visitor.calls)
        result["max_depth"] = max_depth(resolved_entry, visitor.calls)
        print(json.dumps(result, indent=2))

    except Exception as e:
        print(json.dumps({"error": str(e)}))