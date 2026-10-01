from datetime import date
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from .models.core import Role, Difficulty, RelationshipType
class ORM(BaseModel): model_config=ConfigDict(from_attributes=True)
class RegisterIn(BaseModel): name:str=Field(min_length=1,max_length=120); email:EmailStr; password:str=Field(min_length=8,max_length=128)
class LoginIn(BaseModel): email:EmailStr; password:str
class TokenOut(BaseModel): access_token:str; refresh_token:str; token_type:str="bearer"
class UserOut(ORM): id:int; name:str; email:EmailStr; role:Role
class ConceptIn(BaseModel): name:str; category:str; description:str=""; difficulty:Difficulty=Difficulty.MEDIUM
class RelationshipIn(BaseModel): target_concept_id:int; relationship_type:RelationshipType; weight:float=Field(default=1,ge=0,max=1)
class SearchIn(BaseModel): query:str=Field(min_length=2,max_length=4000); top_k:int=Field(default=5,ge=1,le=20); topic:str|None=None
class TutorIn(BaseModel): message:str=Field(min_length=1,max_length=8000); conversation_id:str|None=None; topic:str|None=None
class HintIn(BaseModel): question_id:int; level:int=Field(ge=0,le=5)
class QuestionIn(BaseModel): concept_id:int|None=None; question_text:str; options:list[str]=Field(min_length=2); correct_answer:str; explanation:str; difficulty:Difficulty=Difficulty.MEDIUM; company:str|None=None; question_type:str="QUANTITATIVE"
class AnswerIn(BaseModel): question_id:int; selected_answer:str; solving_time_seconds:float=Field(ge=0,le=7200); hints_used:int=Field(default=0,ge=0,le=5); confidence_score:float=Field(default=.5,ge=0,le=1)
class PracticeStartIn(BaseModel): topic:str|None=None
class RevisionGenerateIn(BaseModel): scheduled_date:date|None=None
class MockTestIn(BaseModel): title:str; company:str; difficulty:Difficulty=Difficulty.MEDIUM; duration_minutes:int=Field(gt=0); question_count:int=Field(gt=0); question_ids:list[int]=[]; config:dict={}
class MockSubmitIn(BaseModel): answers:list[AnswerIn]
