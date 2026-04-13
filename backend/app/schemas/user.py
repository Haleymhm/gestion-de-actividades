from pydantic import BaseModel, EmailStr
from app.models.user import GlobalRole

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: str
    global_role: GlobalRole

    model_config = {"from_attributes": True}
