import argparse
import sys
import json
import importlib
import pkgutil
import os
from colorama import Fore, Style, init

from scorelint.parsers.musicxml import MusicXMLParser
from scorelint.rules.engine import Context, Severity
from scorelint.rules.base import get_all_rules
import scorelint.rules

def load_all_rules():
    """Dynamically loads all modules in the scorelint.rules package."""
    package = scorelint.rules
    prefix = package.__name__ + "."
    for importer, modname, ispkg in pkgutil.walk_packages(package.__path__, prefix):
        importlib.import_module(modname)

def cmd_lint(args):
    try:
        mx_parser = MusicXMLParser()
        score = mx_parser.parse(args.score)
    except Exception as e:
        print(f"Failed to parse {args.score}: {e}")
        sys.exit(1)
        
    context = Context(score, config={})
    
    load_all_rules()
    rules = get_all_rules()
    for rule_cls in rules:
        rule_instance = rule_cls()
        try:
            rule_instance.evaluate(context)
        except Exception as e:
            print(f"Rule {rule_instance.definition().id} failed: {e}")
            
    if args.format == "terminal":
        print(f"{args.score}")
        print()
        
        if not context.findings:
            print(f"{Fore.GREEN}No problems found.{Style.RESET_ALL}")
            sys.exit(0)
            
        for f in context.findings:
            color = Fore.RED if f.severity == Severity.ERROR else Fore.YELLOW if f.severity == Severity.WARNING else Fore.BLUE
            print(f"{color}{f.severity.value.lower()}{Style.RESET_ALL}  {f.location}")
            print(f"{Fore.CYAN}{f.rule_id}{Style.RESET_ALL}")
            print(f"{f.message}")
            print()
            
        print(f"{len(context.findings)} problems")
        
        has_errors = any(f.severity == Severity.ERROR for f in context.findings)
        
        if args.html_report:
            from scorelint.report.html import generate_html_report
            generate_html_report(context, args.html_report)
            print(f"HTML report generated at {args.html_report}")
            
        sys.exit(1 if has_errors else 0)
        
    elif args.format == "json":
        out = []
        for f in context.findings:
            out.append({
                "rule_id": f.rule_id,
                "severity": f.severity.value,
                "message": f.message,
                "location": str(f.location) if f.location else None
            })
            
        if args.html_report:
            from scorelint.report.html import generate_html_report
            generate_html_report(context, args.html_report)
            
        print(json.dumps(out, indent=2))

def cmd_rules(args):
    load_all_rules()
    rules = get_all_rules()
    print("Available Rules:")
    print("-" * 50)
    for rule_cls in rules:
        definition = rule_cls.definition()
        print(f"{Fore.CYAN}{definition.id}{Style.RESET_ALL} ({definition.category}) - {definition.default_severity.value}")
        print(f"  {definition.description}")
        print()

def cmd_diff(args):
    # Semantic Score Diff feature
    print("Semantic Score Diff (Preview)")
    print(f"Comparing {args.before} and {args.after}...")
    
    try:
        mx_parser = MusicXMLParser()
        score_before = mx_parser.parse(args.before)
        score_after = mx_parser.parse(args.after)
    except Exception as e:
        print(f"Failed to parse files: {e}")
        sys.exit(1)
        
    from scorelint.models.diff import SemanticDiff
    sd = SemanticDiff()
    changes = sd.compare(score_before, score_after)
    
    if not changes:
        print("No musical changes found.")
    else:
        for change in changes:
            color = Fore.YELLOW if change['type'] == "CHANGED" else (Fore.GREEN if change['type'] == "ADDED" else Fore.RED)
            print(f"{color}{change['type']}{Style.RESET_ALL} {change['location']}")
            print(f"  {change['details']}")
            print()

def run_cli():
    init()
    parser = argparse.ArgumentParser(description="scorelint: A semantic linter for digital music scores.")
    subparsers = parser.add_subparsers(dest="command", required=False)
    
    # Lint command (default if no subcommand is provided but a file is provided)
    # To support `scorelint piece.xml` and `scorelint lint piece.xml`, we use a slight hack.
    parser.add_argument("score_default", nargs="?", help="Path to the MusicXML file to lint (default command)")
    parser.add_argument("--format", choices=["terminal", "json"], default="terminal", help="Output format")
    
    parser_lint = subparsers.add_parser("lint", help="Lint a music score")
    parser_lint.add_argument("score", help="Path to the MusicXML file")
    parser_lint.add_argument("--format", choices=["terminal", "json"], default="terminal")
    parser_lint.add_argument("--html-report", help="Path to output an HTML report")
    
    parser.add_argument("--html-report", help="Path to output an HTML report (default command)")
    
    parser_rules = subparsers.add_parser("rules", help="List all available rules")
    
    parser_diff = subparsers.add_parser("diff", help="Compare two scores semantically")
    parser_diff.add_argument("before", help="Path to original file")
    parser_diff.add_argument("after", help="Path to modified file")
    
    parser_demo = subparsers.add_parser("demo", help="Run scorelint on a synthetic demo score with errors")
    
    args = parser.parse_args()
    
    if args.command == "rules":
        cmd_rules(args)
    elif args.command == "diff":
        cmd_diff(args)
    elif args.command == "demo":
        print(f"{Fore.CYAN}--- Scorelint Demo ---{Style.RESET_ALL}")
        print("Running linter on a synthetic score with intentional errors.")
        print()
        demo_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "demo.musicxml")
        if not os.path.exists(demo_file):
            demo_file = "demo.musicxml"
        args.score = demo_file
        args.format = "terminal"
        cmd_lint(args)
    elif args.command == "lint":
        cmd_lint(args)
    elif args.score_default:
        # User ran `scorelint piece.xml`
        args.score = args.score_default
        cmd_lint(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    run_cli()
