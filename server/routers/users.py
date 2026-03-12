"""
[역할] 사용자 라우터
- GET    /api/users/me : 내 정보 조회
- DELETE /api/users/me : 회원탈퇴 (soft delete, 비밀번호 재인증 필요)
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.auth import DeleteMeRequest, UpdateMeRequest, UserResponse
from models.db_auth import RefreshToken, User
from services.auth_service import verify_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.username,
        created_at=current_user.created_at,
    )


@router.patch("/me", response_model=UserResponse)
async def update_me(
    request: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if request.username is not None:
        current_user.username = request.username
    await db.commit()
    await db.refresh(current_user)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.username,
        created_at=current_user.created_at,
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    request: DeleteMeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 비밀번호 재인증
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="비밀번호가 올바르지 않습니다.")

    now = datetime.utcnow()

    # soft delete
    current_user.is_deleted = True
    current_user.deleted_at = now

    # 해당 유저 refresh_token 전체 revoke
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == current_user.id, RefreshToken.is_revoked == False)  # noqa: E712
        .values(is_revoked=True)
    )

    await db.commit()
