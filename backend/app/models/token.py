from sqlmodel import SQLModel

# Esto define qué respondemos al loguearse con éxito
class Token(SQLModel):
    access_token: str
    token_type: str