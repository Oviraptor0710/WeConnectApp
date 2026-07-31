from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from google.genai.errors import APIError

from app.config import settings
from app.dependencies import get_current_user
from app.schemas.ai import TranslationRequest, TranslationResponse

router = APIRouter()

@router.post("/translate", response_model=TranslationResponse)
def translate_text(
    request: TranslationRequest,
    current_user=Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API key is not configured."
        )

    try:
        # Initialize the client. It can automatically pick up GEMINI_API_KEY from environment,
        # but we pass it explicitly to be safe using the setting.
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = f"Chuyển văn bản sau sang {request.target_language}. Đầu ra chỉ cần nội dung được dịch cần, tuyệt đối không trả ra cái ngoài bản dịch :\n\n{request.text}"

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite", 
            contents=prompt
        )

        return TranslationResponse(translated_text=response.text)
    except APIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error communicating with Gemini API: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during translation: {str(e)}"
        )
