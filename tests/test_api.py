import os
os.environ['DATABASE_URL']='sqlite:///./test_vectra.db'
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base,engine
from app.models.core import *
Base.metadata.drop_all(engine);Base.metadata.create_all(engine)
c=TestClient(app)
def auth(email='student@example.com'):
 r=c.post('/api/auth/register',json={'name':'Student','email':email,'password':'strong-password-123'});return r.json()['access_token']
def test_auth_and_authorization():
 token=auth();assert c.get('/api/auth/me',headers={'Authorization':f'Bearer {token}'}).status_code==200
 assert c.get('/api/concepts').status_code==401
def test_practice_updates_feedback():
 token=auth('learner@example.com');h={'Authorization':f'Bearer {token}'}
 from app.database import SessionLocal
 db=SessionLocal();u=db.query(User).filter_by(email='learner@example.com').one();u.role=Role.ADMIN;cpt=Concept(name='Percentages',category='QUANT');db.add(cpt);db.commit();qid=None;db.close()
 assert c.post('/api/concepts',json={'name':'Ratio','category':'QUANT'},headers=h).status_code==201
 q=c.post('/api/questions',json={'concept_id':1,'question_text':'2+2?','options':['3','4'],'correct_answer':'4','explanation':'2 plus 2 is 4'},headers=h);assert q.status_code==201
 r=c.post('/api/practice/x/answer',json={'question_id':q.json()['id'],'selected_answer':'4','solving_time_seconds':30},headers=h);assert r.status_code==200 and r.json()['is_correct']
