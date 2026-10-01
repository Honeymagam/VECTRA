from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models.core import User, Role
from .security import decode_token
oauth2=OAuth2PasswordBearer(tokenUrl="/api/auth/login")
def current_user(token:str=Depends(oauth2), db:Session=Depends(get_db)):
    try: uid=decode_token(token,"access")
    except Exception: raise HTTPException(status_code=401,detail="Invalid or expired access token")
    user=db.get(User,uid)
    if not user: raise HTTPException(status_code=401,detail="User not found")
    return user
def admin_user(user:User=Depends(current_user)):
    if user.role != Role.ADMIN: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Admin role required")
    return user
