from typing import List, Dict, Any, Tuple
from scorelint.models.score import Score
from scorelint.models.events import Note, Rest, Chord
from scorelint.models.timing import Duration

class DiffType:
    ADDED = "ADDED"
    REMOVED = "REMOVED"
    CHANGED = "CHANGED"

class SemanticDiff:
    def compare(self, score_old: Score, score_new: Score) -> List[Dict[str, Any]]:
        changes = []
        
        # Build maps for comparison
        # Key: (part_id, measure_number, voice_id)
        # Value: List of events
        old_map = self._build_map(score_old)
        new_map = self._build_map(score_new)
        
        all_keys = set(old_map.keys()) | set(new_map.keys())
        
        for key in sorted(all_keys):
            part_id, m_num, v_id = key
            
            old_events = old_map.get(key, [])
            new_events = new_map.get(key, [])
            
            # Simple pairwise comparison for demo purposes
            # A real diff would use Myers diff or SequenceMatcher
            max_len = max(len(old_events), len(new_events))
            
            for i in range(max_len):
                if i >= len(old_events):
                    changes.append({
                        "location": f"Part {part_id} M{m_num} V{v_id} Event {i}",
                        "type": DiffType.ADDED,
                        "details": f"Added event {type(new_events[i]).__name__}"
                    })
                elif i >= len(new_events):
                    changes.append({
                        "location": f"Part {part_id} M{m_num} V{v_id} Event {i}",
                        "type": DiffType.REMOVED,
                        "details": f"Removed event {type(old_events[i]).__name__}"
                    })
                else:
                    e1 = old_events[i]
                    e2 = new_events[i]
                    
                    diffs = self._compare_events(e1, e2)
                    if diffs:
                        for d in diffs:
                            changes.append({
                                "location": f"Part {part_id} M{m_num} V{v_id} Event {i} (Beat {e1.location.beat})",
                                "type": DiffType.CHANGED,
                                "details": d
                            })
                            
        return changes
        
    def _build_map(self, score: Score) -> Dict[Tuple[str, str, int], List[Any]]:
        m = {}
        for part in score.parts:
            for measure in part.measures:
                for voice_id, voice_state in measure.voices.items():
                    m[(part.id, measure.number, voice_id)] = voice_state.events
        return m
        
    def _compare_events(self, e1, e2) -> List[str]:
        diffs = []
        if type(e1) != type(e2):
            diffs.append(f"Type changed from {type(e1).__name__} to {type(e2).__name__}")
            return diffs
            
        if e1.duration != e2.duration:
            diffs.append(f"Duration changed from {e1.duration} to {e2.duration}")
            
        if isinstance(e1, Note) and isinstance(e2, Note):
            if e1.pitch != e2.pitch:
                diffs.append(f"Pitch changed from {e1.pitch} to {e2.pitch}")
            if e1.tie_start != e2.tie_start or e1.tie_stop != e2.tie_stop:
                diffs.append("Tie changed")
            # could check notations...
            
        return diffs
