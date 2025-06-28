from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from core.auth import (
    User, UserCreate, UserLogin, Token,
    authenticate_user, create_user, get_current_active_user,
    create_access_token, create_refresh_token, verify_token,
    security
)
from core.config import get_settings

router = APIRouter(prefix="/auth", tags=["authentication"])

class UserResponse(BaseModel):
    user: User
    message: str

class RegisterResponse(BaseModel):
    user: User
    tokens: Token
    message: str

class LoginResponse(BaseModel):
    user: User
    tokens: Token
    message: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/register", response_model=RegisterResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        # Create user
        user = await create_user(user_data)
        
        # Create tokens
        settings = get_settings()
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email}, 
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data={"sub": user.id, "email": user.email}
        )
        
        tokens = Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return RegisterResponse(
            user=user,
            tokens=tokens,
            message="User registered successfully"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLogin):
    """Authenticate user and return tokens"""
    try:
        # Authenticate user
        user = await authenticate_user(user_data.email, user_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create tokens
        settings = get_settings()
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email}, 
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data={"sub": user.id, "email": user.email}
        )
        
        tokens = Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        # Convert UserInDB to User for response
        user_response = User(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            subscription_tier=user.subscription_tier,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
        return LoginResponse(
            user=user_response,
            tokens=tokens,
            message="Login successful"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(token_request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        token_data = await verify_token(token_request.refresh_token)
        
        # Create new access token
        settings = get_settings()
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        access_token = create_access_token(
            data={"sub": token_data.user_id, "email": token_data.email},
            expires_delta=access_token_expires
        )
        
        # Create new refresh token
        refresh_token = create_refresh_token(
            data={"sub": token_data.user_id, "email": token_data.email}
        )
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        user=current_user,
        message="User information retrieved successfully"
    )

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user (client should remove tokens)"""
    # In a production app, you might want to blacklist the token
    return {"message": "Logout successful"}

@router.get("/validate-token")
async def validate_token(current_user: User = Depends(get_current_active_user)):
    """Validate if token is still valid"""
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    } 