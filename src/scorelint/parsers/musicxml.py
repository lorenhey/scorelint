import os
from fractions import Fraction
from typing import Dict, List, Optional
from lxml import etree
from scorelint.models.score import Score, Part, Measure, VoiceState, Metadata
from scorelint.models.events import Note, Rest, Chord, Event, Location, SourceMap
from scorelint.models.timing import Duration, TimeSignature, Position
from scorelint.models.pitch import Pitch
from scorelint.models.notation import Tuplet, TimeModification, Slur, Beam

class MusicXMLParser:
    def __init__(self):
        pass
        
    def parse(self, filepath: str) -> Score:
        tree = etree.parse(filepath)
        root = tree.getroot()
        
        score = Score()
        score.metadata = self._parse_metadata(root)
        
        for part_node in root.findall('part'):
            part = self._parse_part(part_node, filepath)
            score.parts.append(part)
            
        return score
        
    def _parse_metadata(self, root: etree._Element) -> Metadata:
        metadata = Metadata()
        work_title = root.find('work/work-title')
        if work_title is not None and work_title.text:
            metadata.title = work_title.text.strip()
            
        creator = root.find('identification/creator[@type="composer"]')
        if creator is not None and creator.text:
            metadata.composer = creator.text.strip()
            
        return metadata

    def _parse_part(self, part_node: etree._Element, filepath: str) -> Part:
        part_id = part_node.get('id', 'unknown')
        part = Part(id=part_id, name=part_id)
        
        divisions = 1
        active_time_signature = None
        
        for measure_node in part_node.findall('measure'):
            measure_number = measure_node.get('number', '0')
            implicit = measure_node.get('implicit') == 'yes'
            
            measure = Measure(number=measure_number, implicit=implicit)
            
            # A measure in MusicXML has a single timeline by default, but backup/forward shift it.
            # We track current fractional position for accurate location reporting.
            current_beat = Duration.zero()
            
            for child in measure_node:
                if child.tag == 'attributes':
                    div_node = child.find('divisions')
                    if div_node is not None and div_node.text:
                        divisions = int(div_node.text)
                        
                    time_node = child.find('time')
                    if time_node is not None:
                        beats = time_node.find('beats')
                        beat_type = time_node.find('beat-type')
                        if beats is not None and beat_type is not None:
                            active_time_signature = TimeSignature(
                                numerator=int(beats.text),
                                denominator=int(beat_type.text)
                            )
                
                measure.time_signature = active_time_signature
                
                if child.tag == 'note':
                    is_chord = child.find('chord') is not None
                    is_grace = child.find('grace') is not None
                    
                    duration_node = child.find('duration')
                    if duration_node is not None and not is_grace:
                        # Duration in divisions
                        divs = int(duration_node.text)
                        # Divisions are per quarter note (denominator 4)
                        # Metric duration = divs / divisions * (1/4) = divs / (divisions * 4)
                        metric_dur = Duration.from_parts(divs, divisions * 4)
                    else:
                        metric_dur = Duration.zero()
                        
                    voice_node = child.find('voice')
                    voice_id = int(voice_node.text) if voice_node is not None and voice_node.text else 1
                    
                    voice_state = measure.get_or_create_voice(voice_id)
                    
                    staff_node = child.find('staff')
                    staff_id = int(staff_node.text) if staff_node is not None and staff_node.text else 1
                    
                    source_map = SourceMap(file=filepath)
                    
                    # Compute location
                    loc_beat = current_beat
                    if is_chord and voice_state.events:
                        # Chords share the start time of the previous note in the voice
                        # We don't advance time
                        loc_beat = loc_beat - metric_dur if metric_dur else loc_beat
                        
                    location = Location(
                        part_id=part_id,
                        staff=staff_id,
                        measure=measure_number,
                        voice=voice_id,
                        beat=loc_beat,
                        source=source_map
                    )

                    rest_node = child.find('rest')
                    pitch_node = child.find('pitch')
                    
                    event: Optional[Event] = None
                    if rest_node is not None:
                        is_measure_rest = rest_node.get('measure') == 'yes'
                        event = Rest(location=location, duration=metric_dur, is_full_measure=is_measure_rest)
                    elif pitch_node is not None:
                        step = pitch_node.find('step').text
                        alter_node = pitch_node.find('alter')
                        alter = float(alter_node.text) if alter_node is not None and alter_node.text else 0.0
                        octave = int(pitch_node.find('octave').text)
                        pitch = Pitch(step=step, alter=alter, octave=octave)
                        
                        tie_start = False
                        tie_stop = False
                        for tie_node in child.findall('tie'):
                            if tie_node.get('type') == 'start':
                                tie_start = True
                            if tie_node.get('type') == 'stop':
                                tie_stop = True
                                
                        event = Note(
                            location=location,
                            duration=metric_dur,
                            pitch=pitch,
                            tie_start=tie_start,
                            tie_stop=tie_stop,
                            is_grace=is_grace
                        )
                        
                    if event:
                        if isinstance(event, Note):
                            # Parse notations
                            notations = child.find('notations')
                            if notations is not None:
                                for tuplet_node in notations.findall('tuplet'):
                                    t_type = tuplet_node.get('type')
                                    t_num = int(tuplet_node.get('number', '1'))
                                    event.tuplets.append(Tuplet(type=t_type, number=t_num))
                                    
                                for slur_node in notations.findall('slur'):
                                    s_type = slur_node.get('type')
                                    s_num = int(slur_node.get('number', '1'))
                                    event.slurs.append(Slur(type=s_type, number=s_num))
                                    
                            # Parse time-modification
                            tmod = child.find('time-modification')
                            if tmod is not None:
                                act = int(tmod.find('actual-notes').text) if tmod.find('actual-notes') is not None else 1
                                norm = int(tmod.find('normal-notes').text) if tmod.find('normal-notes') is not None else 1
                                event.time_modification = TimeModification(actual_notes=act, normal_notes=norm)
                                
                            # Parse beams
                            for beam_node in child.findall('beam'):
                                b_type = beam_node.text
                                b_num = int(beam_node.get('number', '1'))
                                if b_type:
                                    event.beams.append(Beam(type=b_type, number=b_num))

                        if is_chord and voice_state.events and isinstance(event, Note):
                            prev = voice_state.events[-1]
                            if isinstance(prev, Note):
                                # Convert Note to Chord
                                chord = Chord(location=prev.location, duration=prev.duration)
                                chord.notes = [prev, event]
                                voice_state.events[-1] = chord
                            elif isinstance(prev, Chord):
                                prev.notes.append(event)
                                
                        if not is_chord:
                            if not is_grace:
                                current_beat = current_beat + metric_dur
                            voice_state.events.append(event)
                            
                elif child.tag == 'backup':
                    duration_node = child.find('duration')
                    if duration_node is not None:
                        divs = int(duration_node.text)
                        metric_dur = Duration.from_parts(divs, divisions * 4)
                        current_beat = current_beat - metric_dur
                        
                elif child.tag == 'forward':
                    duration_node = child.find('duration')
                    if duration_node is not None:
                        divs = int(duration_node.text)
                        metric_dur = Duration.from_parts(divs, divisions * 4)
                        current_beat = current_beat + metric_dur
                        
            part.measures.append(measure)
            
        return part
