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
def test_profile_can_be_saved():
 token=auth('profile@example.com');h={'Authorization':f'Bearer {token}'}
 response=c.patch('/api/auth/profile',headers=h,json={'name':'Learner One','goal':'Improve aptitude skills','target_companies':['TCS'],'preferred_topics':['Percentages']})
 assert response.status_code==200
 assert response.json()['goal']=='Improve aptitude skills'
 assert c.get('/api/auth/me',headers=h).json()['name']=='Learner One'
def test_search_is_scoped_to_document_owner():
 owner=auth('owner@example.com');auth('other@example.com')
 from app.database import SessionLocal
 from app.services import embedder
 db=SessionLocal();users={u.email:u for u in db.query(User).filter(User.email.in_(['owner@example.com','other@example.com'])).all()}
 for email in users:
  doc=Document(uploaded_by=users[email].id,filename=f'{email}.txt',file_type='txt');db.add(doc);db.flush()
  db.add(DocumentChunk(document_id=doc.id,chunk_text='private arithmetic learning content',topic='Percentages',chunk_index=0,embedding=embedder.embed('private arithmetic learning content'),metadata_json={}))
 db.commit();db.close()
 response=c.post('/api/search',headers={'Authorization':f'Bearer {owner}'},json={'query':'arithmetic learning','top_k':10})
 assert response.status_code==200
 assert response.json()['results']
 assert all(item['document_name']=='owner@example.com.txt' for item in response.json()['results'])
def test_csv_upload_is_processed_and_searchable():
 token=auth('csv@example.com');h={'Authorization':f'Bearer {token}'}
 content='Topic,Formula\nPercentages,successive percentage changes\nTime and Work,combined work rates\n'
 uploaded=c.post('/api/documents/upload',headers=h,files={'file':('study-notes.csv',content,'text/csv')})
 assert uploaded.status_code==201 and uploaded.json()['status']=='COMPLETED'
 results=c.post('/api/search',headers=h,json={'query':'successive percentage changes','top_k':5}).json()['results']
 assert results and results[0]['document_name']=='study-notes.csv'
 assert 'Formula: successive percentage changes' in results[0]['chunk']
def test_practice_updates_feedback():
 token=auth('learner@example.com');h={'Authorization':f'Bearer {token}'}
 from app.database import SessionLocal
 db=SessionLocal();u=db.query(User).filter_by(email='learner@example.com').one();u.role=Role.ADMIN;cpt=Concept(name='Percentages',category='QUANT');db.add(cpt);db.commit();qid=None;db.close()
 assert c.post('/api/concepts',json={'name':'Ratio','category':'QUANT'},headers=h).status_code==201
 q=c.post('/api/questions',json={'concept_id':1,'question_text':'2+2?','options':['3','4'],'correct_answer':'4','explanation':'2 plus 2 is 4'},headers=h);assert q.status_code==201
 r=c.post('/api/practice/x/answer',json={'question_id':q.json()['id'],'selected_answer':'4','solving_time_seconds':30},headers=h);assert r.status_code==200 and r.json()['is_correct'] and r.json()['correct_index']==1
 started=c.post('/api/mock-tests/quick-start',headers=h);assert started.status_code==200
 assert all('correct_answer' not in item for item in started.json()['questions'])
 mock_id=started.json()['mock_test_id'];question=started.json()['questions'][0]
 submitted=c.post(f'/api/mock-tests/{mock_id}/submit',headers=h,json={'answers':[{'question_id':question['id'],'selected_answer':'4','solving_time_seconds':40}]})
 assert submitted.status_code==200 and submitted.json()['grades'][0]['is_correct']
 assert c.get('/api/analytics/overview',headers=h).json()['mock_tests']==1
