from app.database import Base,engine,SessionLocal
from app.models.core import *
from app.security import hash_password
Base.metadata.create_all(engine);db=SessionLocal()
if not db.query(User).filter_by(email='admin@vectra.local').first():
 db.add_all([User(name='Admin',email='admin@vectra.local',password_hash=hash_password('ChangeMe123!'),role=Role.ADMIN),User(name='Demo Student',email='student@vectra.local',password_hash=hash_password('ChangeMe123!'))]);db.commit()
for name in ['Percentages','Profit & Loss','Ratio','Average','Time & Work','Simple Interest','Probability','Permutation & Combination','Logical Reasoning','Verbal Ability','Data Interpretation']:
 if not db.query(Concept).filter_by(name=name).first():db.add(Concept(name=name,category='APTITUDE'))
db.commit();print('Seeded. Change the default passwords before deployment.')
