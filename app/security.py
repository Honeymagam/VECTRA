from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from .config import get_settings
password_hash=PasswordHash.recommended()
def hash_password(password:str)->str:return password_hash.hash(password)
def verify_password(password:str, hashed:str)->bool:return password_hash.verify(password,hashed)
def create_token(subject:str, kind:str, expires:timedelta)->str:
    s=get_settings(); return jwt.encode({"sub":subject,"type":kind,"exp":datetime.now(timezone.utc)+expires},s.jwt_secret,algorithm=s.jwt_algorithm)
def decode_token(token:str, kind:str)->int:
    s=get_settings(); payload=jwt.decode(token,s.jwt_secret,algorithms=[s.jwt_algorithm])
    if payload.get("type")!=kind: raise jwt.InvalidTokenError("Wrong token type")
    return int(payload["sub"])
