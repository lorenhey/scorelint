from typing import List, Dict
import os
from scorelint.rules.engine import Context, Severity

def generate_html_report(context: Context, out_path: str):
    findings_by_severity = {s: [] for s in Severity}
    findings_by_category = {}
    
    for f in context.findings:
        findings_by_severity[f.severity].append(f)
        cat = f.rule_id.split('.')[0].upper()
        if cat not in findings_by_category:
            findings_by_category[cat] = []
        findings_by_category[cat].append(f)
        
    html = [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        "<meta charset='utf-8'>",
        "<title>Scorelint Report</title>",
        "<style>",
        "body { font-family: sans-serif; margin: 40px; color: #333; }",
        "h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }",
        ".finding { margin-bottom: 15px; padding: 10px; border-left: 4px solid #999; background: #fafafa; }",
        ".ERROR { border-color: #e74c3c; }",
        ".WARNING { border-color: #f39c12; }",
        ".STYLE { border-color: #3498db; }",
        ".INFO { border-color: #2ecc71; }",
        ".severity { font-weight: bold; }",
        ".rule-id { font-family: monospace; color: #555; }",
        "</style>",
        "</head>",
        "<body>",
        "<h1>Scorelint Report</h1>",
        "<h2>Summary</h2>",
        "<ul>"
    ]
    
    for sev in Severity:
        count = len(findings_by_severity[sev])
        html.append(f"<li>{sev.value}: {count}</li>")
        
    html.append("</ul>")
    
    html.append("<h2>Findings</h2>")
    
    if not context.findings:
        html.append("<p>No problems found.</p>")
    else:
        for f in context.findings:
            html.append(f"<div class='finding {f.severity.value}'>")
            html.append(f"<div class='severity'>{f.severity.value} - <span class='rule-id'>{f.rule_id}</span></div>")
            loc_str = str(f.location) if f.location else "Global"
            html.append(f"<div><strong>Location:</strong> {loc_str}</div>")
            html.append(f"<div>{f.message}</div>")
            html.append("</div>")
            
    html.append("</body></html>")
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(html))
