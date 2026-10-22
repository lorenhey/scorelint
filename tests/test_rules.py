import unittest
from pathlib import Path
from scorelint.parsers.musicxml import MusicXMLParser
from scorelint.rules.engine import Context, Severity
from scorelint.rules.base import get_all_rules
from scorelint.cli import load_all_rules

class TestScorelintRules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        load_all_rules()
        cls.rules = get_all_rules()
        cls.parser = MusicXMLParser()
        cls.fixtures_dir = Path(__file__).parent / "fixtures"

    def test_measure_duration_invalid(self):
        file_path = self.fixtures_dir / "measure_duration_invalid.musicxml"
        score = self.parser.parse(file_path)
        context = Context(score, config={})
        
        for rule_cls in self.rules:
            rule_cls().evaluate(context)
            
        rule_ids = [f.rule_id for f in context.findings]
        self.assertIn("rhythm.measure-duration", rule_ids)
        
        duration_finding = next(f for f in context.findings if f.rule_id == "rhythm.measure-duration")
        self.assertEqual(duration_finding.severity, Severity.ERROR)
        self.assertIn("contains 7/8 of notated duration in a 4/4 measure", duration_finding.message)

    def test_tie_pitch_mismatch(self):
        file_path = self.fixtures_dir / "tie_pitch_mismatch.musicxml"
        score = self.parser.parse(file_path)
        context = Context(score, config={})
        
        for rule_cls in self.rules:
            rule_cls().evaluate(context)
            
        rule_ids = [f.rule_id for f in context.findings]
        self.assertIn("ties.pitch-mismatch", rule_ids)
        
        tie_finding = next(f for f in context.findings if f.rule_id == "ties.pitch-mismatch")
        self.assertEqual(tie_finding.severity, Severity.WARNING)
        self.assertIn("Tie starts on written", tie_finding.message)

    def test_demo_file_findings(self):
        root_dir = Path(__file__).parent.parent
        file_path = root_dir / "demo.musicxml"
        score = self.parser.parse(file_path)
        context = Context(score, config={})
        
        for rule_cls in self.rules:
            rule_cls().evaluate(context)
            
        rule_ids = [f.rule_id for f in context.findings]
        self.assertIn("rhythm.measure-duration", rule_ids)
        self.assertIn("ties.pitch-mismatch", rule_ids)
        self.assertIn("slurs.unmatched", rule_ids)
        self.assertEqual(len(context.findings), 3)

if __name__ == '__main__':
    unittest.main()
