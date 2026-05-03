from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserRead(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

        from pydantic import BaseModel

class UserLogin(BaseModel):
    email: str
    password: str