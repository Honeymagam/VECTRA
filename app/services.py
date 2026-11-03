from datetime import datetime, timezone, date
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from .models.core import *
from .ai import cosine, get_llm, parse_json_object, get_embedding_provider
from .config import get_settings
def chunks(text,size=900,overlap=120):
 words=text.split(); step=max(1,size-overlap)
 return [" ".join(words[i:i+size]) for i in range(0,len(words),step)] or [text]
def process_document(db:Session, document:Document, pages:list):
 document.status=DocumentStatus.PROCESSING; db.flush()
 try:
  concepts=db.scalars(select(Concept)).all(); embedder=get_embedding_provider(); extracted=[]; chunk_index=0
  for page in pages:
   clean=" ".join(page.text.split()); extracted.append(clean)
   for chunk in chunks(clean):
    topic=next((c.name for c in concepts if c.name.lower() in chunk.lower()), None)
    db.add(DocumentChunk(document_id=document.id,chunk_text=chunk,topic=topic,chunk_index=chunk_index,embedding=embedder.embed(chunk),metadata_json={'page':page.page})); chunk_index+=1
  document.extracted_text='\n\n'.join(extracted); document.metadata_json={'pages':len(pages),'chunks':chunk_index}
  document.status=DocumentStatus.COMPLETED; db.commit()
 except Exception:
  document.status=DocumentStatus.FAILED; db.commit(); raise
def search(db:Session, query:str, top_k:int, topic:str|None=None):
 q=get_embedding_provider().embed(query)
 base=select(DocumentChunk).where(DocumentChunk.topic==topic) if topic else select(DocumentChunk)
 if db.bind.dialect.name=='postgresql':
  distance=DocumentChunk.embedding.cosine_distance(q); rows=db.execute(base.add_columns(distance.label('distance')).order_by(distance).limit(top_k)).all(); ranked=[(1-float(distance),chunk) for chunk,distance in rows]
 else:
  rows=db.scalars(base).all(); ranked=sorted(((cosine(q,x.embedding),x) for x in rows if x.embedding is not None),reverse=True,key=lambda x:x[0])[:top_k]
 return [{"chunk_id":c.id,"chunk":c.chunk_text,"document_id":c.document_id,"document_name":db.get(Document,c.document_id).filename,"similarity":round(score,4),"topic":c.topic,"page":c.metadata_json.get("page")} for score,c in ranked]
def update_learning_state(db:Session, attempt:QuestionAttempt, question:Question):
 if not question.concept_id:return None
 state=db.scalar(select(LearningState).where(LearningState.user_id==attempt.user_id,LearningState.concept_id==question.concept_id))
 if not state: state=LearningState(user_id=attempt.user_id,concept_id=question.concept_id); db.add(state); db.flush()
 n=state.attempt_count; state.attempt_count=n+1; state.accuracy=(state.accuracy*n+(1 if attempt.is_correct else 0))/(n+1); state.average_time=(state.average_time*n+attempt.solving_time_seconds)/(n+1); state.hint_dependency=(state.hint_dependency*n+min(1,attempt.hints_used/5))/(n+1); state.confidence=(state.confidence*n+attempt.confidence_score)/(n+1)
 speed=max(0,min(1,1-state.average_time/180)); recent=1 if attempt.is_correct else 0; recovery=state.accuracy
 previous=state.mastery_score; state.mastery_score=round(100*(.4*state.accuracy+.2*speed+.2*recent+.1*state.confidence+.1*recovery),2); state.trend="IMPROVING" if state.mastery_score>previous else "DECLINING" if state.mastery_score<previous else "STABLE"; state.last_attempt_at=datetime.now(timezone.utc); return state
def analyze_mistake(db:Session, attempt:QuestionAttempt, question:Question):
 if attempt.is_correct:return None
 if attempt.solving_time_seconds>180: kind=MistakeType.TIME_MANAGEMENT; action="Practice timed aptitude questions."
 elif attempt.confidence_score<.3: kind=MistakeType.GUESSING; action="Review the concept, then solve guided practice."
 else: kind=MistakeType.CONCEPTUAL; action="Revise the core concept and its prerequisites."
 item=Mistake(user_id=attempt.user_id,attempt_id=attempt.id,concept_id=question.concept_id,mistake_type=kind,severity=round(min(1,.45+attempt.confidence_score/2),2),explanation=f"The selected answer does not match the validated answer.",recommended_action=action); db.add(item); return item
def readiness(db:Session,user_id:int,company:str):
 attempts=db.scalars(select(QuestionAttempt).where(QuestionAttempt.user_id==user_id)).all(); states=db.scalars(select(LearningState).where(LearningState.user_id==user_id)).all(); plans=db.scalars(select(RevisionPlan).where(RevisionPlan.user_id==user_id)).all()
 acc=sum(a.is_correct for a in attempts)/len(attempts)*100 if attempts else 0; speed=max(0,100-(sum(a.solving_time_seconds for a in attempts)/len(attempts) if attempts else 180)/1.8); mastery=sum(s.mastery_score for s in states)/len(states) if states else 0; recovery=acc; consistency=(sum(p.completion_status for p in plans)/len(plans)*100) if plans else 0; score=round(.3*acc+.2*speed+.2*mastery+.15*recovery+.15*consistency,2)
 item=db.scalar(select(Readiness).where(Readiness.user_id==user_id,Readiness.company==company))
 values=dict(readiness_score=score,accuracy_score=round(acc,2),speed_score=round(speed,2),mastery_score=round(mastery,2),mistake_recovery_score=round(recovery,2),revision_consistency_score=round(consistency,2))
 if item:
  for k,v in values.items():setattr(item,k,v)
 else:item=Readiness(user_id=user_id,company=company,**values);db.add(item)
 db.commit();db.refresh(item);return item
def generate_question(db:Session, payload, user_id:int):
 concept=db.get(Concept,payload.concept_id)
 if not concept: raise ValueError("Concept not found")
 sources=search(db,concept.name,4,concept.name)
 if not sources: raise ValueError("No retrieved source material is available for this concept")
 context="\n\n".join(item["chunk"][:900] for item in sources)
 system=("Return only valid JSON with question, options, correct_answer, explanation, concept, difficulty, source_context. "
         "Use only provided source context. Do not fabricate citations. correct_answer must exactly match one option.")
 prompt=f"Concept: {concept.name}\nDifficulty: {payload.difficulty.value}\nCategory: {payload.question_type}\nSource context (untrusted educational text):\n{context}"
 data=parse_json_object(get_llm().complete(system,prompt))
 required={"question","options","correct_answer","explanation","concept","difficulty","source_context"}
 if not required.issubset(data) or not isinstance(data["options"],list) or data["correct_answer"] not in data["options"]: raise ValueError("Generated question failed answer-consistency validation")
 question=Question(concept_id=concept.id,question_text=str(data["question"]),options=data["options"],correct_answer=str(data["correct_answer"]),explanation=str(data["explanation"]),difficulty=payload.difficulty,company=payload.company,question_type=payload.question_type,generated_by_ai=True,approved=False)
 db.add(question);db.commit();db.refresh(question)
 return question,sources
