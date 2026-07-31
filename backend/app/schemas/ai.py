from pydantic import BaseModel

class TranslationRequest(BaseModel):
    text: str
    target_language: str = "Vietnamese" # default target language

class TranslationResponse(BaseModel):
    translated_text: str
