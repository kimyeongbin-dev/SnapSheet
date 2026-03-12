"""
[역할] 인증 라우터
- POST /api/auth/signup  : 회원가입
- POST /api/auth/login   : 로그인
- POST /api/auth/refresh : 토큰 갱신
- POST /api/auth/logout  : 로그아웃
"""
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.auth import LoginRequest, RefreshRequest, SignupRequest, TokenResponse
from models.db_auth import RefreshToken, User
from services.auth_service import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    # 이메일 중복 확인 (탈퇴한 계정 제외)
    result = await db.execute(
        select(User).where(User.email == request.email, User.is_deleted == False)  # noqa: E712
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 사용 중인 이메일입니다.")

    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        username=request.username,
    )
    db.add(user)
    await db.flush()  # user.id 확정

    raw_token, token_hash, expires_at = create_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=raw_token,
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    from datetime import datetime

    result = await db.execute(
        select(User).where(User.email == request.email, User.is_deleted == False)  # noqa: E712
    )
    user = result.scalar_one_or_none()

    # 계정 없음 / 비밀번호 틀림 → 동일 메시지로 응답 (계정 존재 여부 노출 방지)
    if not user or not verify_password(request.password, user.hashed_password):
        if user:
            # 잠금 확인
            if user.login_locked_until and user.login_locked_until > datetime.utcnow():
                remaining = int((user.login_locked_until - datetime.utcnow()).total_seconds() / 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"로그인이 잠겼습니다. {remaining}분 후 다시 시도해주세요."
                )
            user.login_failed_count += 1
            if user.login_failed_count >= 5:
                from datetime import timedelta
                user.login_locked_until = datetime.utcnow() + timedelta(minutes=30)
                user.login_failed_count = 0
            await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    # 잠금 상태 확인 (비밀번호 맞아도 잠금 중이면 차단)
    if user.login_locked_until and user.login_locked_until > datetime.utcnow():
        remaining = int((user.login_locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"로그인이 잠겼습니다. {remaining}분 후 다시 시도해주세요."
        )

    # 로그인 성공 → 실패 카운트 초기화
    user.login_failed_count = 0
    user.login_locked_until = None

    raw_token, token_hash, expires_at = create_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=raw_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(request.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,  # noqa: E712
        )
    )
    stored = result.scalar_one_or_none()

    if not stored:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰입니다.")

    # 만료 확인 (naive UTC 기준)
    from datetime import datetime
    if stored.expires_at < datetime.utcnow():
        stored.is_revoked = True
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰이 만료되었습니다.")

    # Refresh token rotation
    stored.is_revoked = True
    raw_token, new_hash, expires_at = create_refresh_token()
    db.add(RefreshToken(user_id=stored.user_id, token_hash=new_hash, expires_at=expires_at))
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(str(stored.user_id)),
        refresh_token=raw_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: RefreshRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token_hash = hash_token(request.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == current_user.id,  # 본인 토큰만 revoke
        )
    )
    stored = result.scalar_one_or_none()
    if stored:
        stored.is_revoked = True
        await db.commit()
