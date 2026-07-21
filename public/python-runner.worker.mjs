const runnerSource = String.raw`
import ast
import io
from contextlib import redirect_stdout

allowed_nodes = (
    ast.Module, ast.Expr, ast.Assign, ast.AnnAssign, ast.AugAssign,
    ast.Name, ast.Load, ast.Store, ast.Constant,
    ast.Call, ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare, ast.If,
    ast.JoinedStr, ast.FormattedValue, ast.List, ast.Tuple,
    ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod,
    ast.UAdd, ast.USub, ast.Not, ast.And, ast.Or,
    ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
)
allowed_calls = {"print", "str", "int", "float", "len", "round", "bool", "min", "max"}

tree = ast.parse(USER_CODE, mode="exec")
for node in ast.walk(tree):
    if not isinstance(node, allowed_nodes):
        raise ValueError(f"Per ora questo progetto non usa {type(node).__name__}. Usa soltanto variabili, calcoli, condizioni semplici e print.")
    if isinstance(node, ast.Name) and node.id.startswith("_"):
        raise ValueError("I nomi che iniziano con _ non sono disponibili in questo spazio didattico.")
    if isinstance(node, ast.Call) and (not isinstance(node.func, ast.Name) or node.func.id not in allowed_calls):
        raise ValueError("In questi primi progetti puoi chiamare soltanto print, str, int, float, len, round, bool, min e max.")

safe_builtins = {
    "print": print, "str": str, "int": int, "float": float,
    "len": len, "round": round, "bool": bool, "min": min, "max": max,
}
output = io.StringIO()
namespace = {"__builtins__": safe_builtins}
with redirect_stdout(output):
    exec(compile(tree, "python-project", "exec"), namespace, namespace)
output.getvalue()
`;

let pyodide;

async function prepare() {
  const { loadPyodide } = await import("https://cdn.jsdelivr.net/pyodide/v314.0.2/full/pyodide.mjs");
  pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.2/full/" });
  self.postMessage({ type: "ready" });
}

prepare().catch((error) => self.postMessage({ type: "init-error", error: String(error?.message ?? error) }));

self.addEventListener("message", async (event) => {
  if (event.data?.type !== "run" || typeof event.data.code !== "string" || !pyodide) return;
  const id = event.data.id;
  try {
    pyodide.globals.set("USER_CODE", event.data.code);
    const output = String(await pyodide.runPythonAsync(runnerSource) || "Il programma è terminato senza mostrare risultati. Usa print(...) per visualizzarli.");
    self.postMessage({ type: "result", id, output: output.length > 1000 ? `${output.slice(0, 960)}\n… risultato abbreviato` : output });
  } catch (error) {
    const message = String(error?.message ?? error).replace(/^PythonError:\s*/, "").split("\n").slice(-2).join("\n");
    self.postMessage({ type: "result", id, error: message });
  } finally {
    pyodide.globals.delete("USER_CODE");
  }
});
