from fastapi import APIRouter, Request, Body, HTTPException
from services.screenshot_service import generate_project_previews
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/projects/generate-previews")
async def generate_previews(
    request: Request,
    html_content: str = Body(...),
    project_id: str = Body(...)
):
    """Generate preview images from HTML content"""
    try:
        # Generate preview images
        previews = await generate_project_previews(html_content, project_id)
        
        if not previews:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate preview images"
            )
        
        return previews
        
    except Exception as e:
        logger.error(f"Preview generation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) 