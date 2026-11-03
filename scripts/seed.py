from app.database import Base,engine,SessionLocal
from app.models.core import *
from app.security import hash_password
Base.metadata.create_all(engine);db=SessionLocal()
if not db.query(User).filter_by(email='admin@vectra.local').first():
 db.add_all([User(name='Admin',email='admin@vectra.local',password_hash=hash_password('ChangeMe123!'),role=Role.ADMIN),User(name='Demo Student',email='student@vectra.local',password_hash=hash_password('ChangeMe123!'))]);db.commit()
for name in ['Percentages','Profit & Loss','Ratio','Average','Time & Work','Simple Interest','Probability','Permutation & Combination','Logical Reasoning','Verbal Ability','Data Interpretation']:
 if not db.query(Concept).filter_by(name=name).first():db.add(Concept(name=name,category='APTITUDE'))
db.commit()
concepts={c.name:c for c in db.query(Concept).all()}
links=[('Percentages','Profit & Loss'),('Percentages','Simple Interest'),('Ratio','Average')]
for source,target in links:
 if not db.query(ConceptRelationship).filter_by(source_concept_id=concepts[source].id,target_concept_id=concepts[target].id,relationship_type=RelationshipType.PREREQUISITE).first(): db.add(ConceptRelationship(source_concept_id=concepts[source].id,target_concept_id=concepts[target].id,relationship_type=RelationshipType.PREREQUISITE,weight=1.0))
student=db.query(User).filter_by(email='student@vectra.local').first()
if not db.query(Question).first():
 q=Question(concept_id=concepts['Percentages'].id,question_text='What is 25% of 200?',options=['25','50','75','100'],correct_answer='50',explanation='25% equals one quarter; one quarter of 200 is 50.',difficulty=Difficulty.EASY,question_type='QUANTITATIVE');db.add(q);db.flush();a=QuestionAttempt(user_id=student.id,question_id=q.id,selected_answer='50',is_correct=True,solving_time_seconds=45,hints_used=0,confidence_score=.8);db.add(a);db.add(LearningState(user_id=student.id,concept_id=concepts['Percentages'].id,mastery_score=72,accuracy=1,average_time=45,hint_dependency=0,confidence=.8,attempt_count=1,trend='IMPROVING'))
db.commit();print('Seeded. Change the default passwords before deployment.')
