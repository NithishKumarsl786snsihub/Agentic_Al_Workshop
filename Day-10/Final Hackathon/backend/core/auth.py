from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from bson import ObjectId
from core.config import get_settings
from core.database import get_database

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token
security = HTTPBearer()

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool = True
    subscription_tier: str = "free"
    created_at: datetime
    updated_at: datetime

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    settings = get_settings()
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def verify_token(token: str) -> TokenData:
    """Verify JWT token and return token data"""
    settings = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None or email is None:
            raise credentials_exception
            
        token_data = TokenData(user_id=user_id, email=email)
    except JWTError:
        raise credentials_exception
    
    return token_data

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Get user by email from database"""
    db = await get_database()
    user_doc = await db.users.find_one({"email": email})
    
    if user_doc:
        return UserInDB(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            username=user_doc["username"],
            full_name=user_doc.get("full_name"),
            is_active=user_doc.get("is_active", True),
            subscription_tier=user_doc.get("subscription_tier", "free"),
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"],
            hashed_password=user_doc["hashed_password"]
        )
    return None

async def get_user_by_id(user_id: str) -> Optional[User]:
    """Get user by ID from database"""
    db = await get_database()
    try:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if user_doc:
            return User(
                id=str(user_doc["_id"]),
                email=user_doc["email"],
                username=user_doc["username"],
                full_name=user_doc.get("full_name"),
                is_active=user_doc.get("is_active", True),
                subscription_tier=user_doc.get("subscription_tier", "free"),
                created_at=user_doc["created_at"],
                updated_at=user_doc["updated_at"]
            )
    except Exception:
        return None
    
    return None

async def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    """Authenticate user with email and password"""
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def create_user(user_create: UserCreate) -> User:
    """Create a new user"""
    db = await get_database()
    
    # Check if user already exists
    existing_user = await get_user_by_email(user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_create.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user document
    now = datetime.utcnow()
    user_doc = {
        "email": user_create.email,
        "username": user_create.username,
        "full_name": user_create.full_name,
        "hashed_password": get_password_hash(user_create.password),
        "is_active": True,
        "subscription_tier": "free",
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.users.insert_one(user_doc)
    
    return User(
        id=str(result.inserted_id),
        email=user_create.email,
        username=user_create.username,
        full_name=user_create.full_name,
        is_active=True,
        subscription_tier="free",
        created_at=now,
        updated_at=now
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    token_data = await verify_token(credentials.credentials)
    user = await get_user_by_id(token_data.user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user 