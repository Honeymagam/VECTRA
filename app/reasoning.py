"""Deterministic orchestration around retrieval and learner state.

The rules are intentionally explicit so VECTRA's tutoring choices are inspectable.
"""
from dataclasses import dataclass
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models.core import Concept, LearningState, Mistake

INTENTS=('LEARN_CONCEPT','SOLVE_PROBLEM','ASK_HINT','ASK_FORMULA','ASK_SHORTCUT','REVIEW_MISTAKE','PRACTICE','REVISION')
@dataclass
class ReasoningPlan:
 intent:str; concepts:list[str]; proficiency:float; explanation_level:int; recommended_action:str

def determine_intent(message:str)->str:
 text=message.lower()
 if 'hint' in text: return 'ASK_HINT'
 if 'formula' in text: return 'ASK_FORMULA'
 if 'shortcut' in text: return 'ASK_SHORTCUT'
 if 'mistake' in text or 'wrong' in text: return 'REVIEW_MISTAKE'
 if 'revision' in text or 'revise' in text: return 'REVISION'
 if 'practice' in text or 'question' in text: return 'PRACTICE'
 if any(word in text for word in ('solve','calculate','answer')): return 'SOLVE_PROBLEM'
 return 'LEARN_CONCEPT'

def plan_reasoning(db:Session,user_id:int,message:str,concept_names:list[str])->ReasoningPlan:
 names=list(dict.fromkeys(concept_names)); states=[]
 for name in names:
  concept=db.scalar(select(Concept).where(Concept.name==name))
  if concept:
   state=db.scalar(select(LearningState).where(LearningState.user_id==user_id,LearningState.concept_id==concept.id))
   if state: states.append(state.mastery_score)
 proficiency=sum(states)/len(states) if states else 0
 intent=determine_intent(message)
 level=1 if proficiency<40 else 2 if proficiency<70 else 3
 if intent=='ASK_HINT': level=min(level,1)
 if intent=='SOLVE_PROBLEM': level=min(level,3)
 action='Attempt a guided practice question.' if proficiency<70 else 'Attempt a timed question at the current level.'
 if intent=='REVISION': action='Open the revision plan and start the highest-priority concept.'
 return ReasoningPlan(intent,names,round(proficiency,2),level,action)
