"""
[역할] 인증 관련 핵심 로직
- 비밀번호 해싱 / 검증 (bcrypt)
- JWT access token 발급 / 검증
- refresh token 생성 (원본 + sha256 해시)
"""
import hashlib
import os
import secrets
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.environ.get("SECRET_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", 7))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    """검증 후 user_id(sub) 반환. 실패 시 JWTError 발생."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    if not user_id:
        raise JWTError("sub missing")
    return user_id


def create_refresh_token() -> tuple[str, str, datetime]:
    """(원본 토큰, sha256 해시, 만료일시) 반환 — naive UTC"""
    token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return token, token_hash, expires_at


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
