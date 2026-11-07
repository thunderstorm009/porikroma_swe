from __future__ import annotations

from collections import defaultdict
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import AuthenticatedUser, get_active_user, get_current_profile, get_optional_user
from app.api.pagination import MAX_PAGE
from app.db.database import get_db
from app.models import (
    AnswerLike,
    Destination,
    ForumAnswer,
    ForumQuestion,
    ForumReply,
    ForumTag,
    Profile,
    QuestionBookmark,
    QuestionFollower,
    QuestionLike,
    Role,
    UserRole,
)
from app.schemas import (
    AnswerCreate,
    AnswerRead,
    DestinationRead,
    ProfileRead,
    QuestionBundle,
    QuestionCreate,
    QuestionRead,
    QuestionUpdate,
    ReplyCreate,
    ReplyRead,
)
from app.services.authorization import ensure_exists
from app.services.rate_limit import check_content_write_rate_limit

router = APIRouter(prefix="/forum", tags=["Forum"])

SortOption = Literal["latest", "trending", "most_helpful", "most_discussed", "unanswered"]
ROLE_PRIORITY = ("platform_admin", "provider", "tour_planner", "traveler")


# ---- Author decoration (batched: one query per concern, not per row) -----------

class AuthorDirectory:
    """Public role and contribution count for a set of authors, loaded in two queries."""

    def __init__(self, db: Session, author_ids: set[UUID]):
        self.roles: dict[UUID, set[str]] = defaultdict(set)
        self.contributions: dict[UUID, int] = defaultdict(int)
        if not author_ids:
            return
        for user_id, role_name in db.execute(
            select(UserRole.user_id, Role.name)
            .join(Role, Role.id == UserRole.role_id)
            .where(UserRole.user_id.in_(author_ids), UserRole.revoked_at.is_(None))
        ):
            self.roles[user_id].add(role_name)
        for model in (ForumQuestion, ForumAnswer):
            for author_id, count in db.execute(
                select(model.author_id, func.count()).where(model.author_id.in_(author_ids)).group_by(model.author_id)
            ):
                self.contributions[author_id] += count

    def profile(self, profile: Profile | None) -> ProfileRead | None:
        if profile is None:
            return None
        roles = self.roles.get(profile.id, set())
        role = next((item for item in ROLE_PRIORITY if item in roles), "traveler")
        return ProfileRead.model_validate(profile).model_copy(update={
            "role": role,
            "contribution_count": self.contributions.get(profile.id, 0),
        })


def user_flags(db: Session, model, key: str, ids: list[UUID], user_id: UUID | None) -> set[UUID]:
    if not user_id or not ids:
        return set()
    column = getattr(model, key)
    return set(db.scalars(select(column).where(column.in_(ids), model.user_id == user_id)))


def grouped_counts(db: Session, column, ids: list[UUID]) -> dict[UUID, int]:
    if not ids:
        return {}
    return dict(db.execute(select(column, func.count()).where(column.in_(ids)).group_by(column)).all())


def question_reads(db: Session, questions: list[ForumQuestion], user_id: UUID | None) -> list[QuestionRead]:
    ids = [question.id for question in questions]
    answer_counts = grouped_counts(db, ForumAnswer.question_id, ids)
    like_counts = grouped_counts(db, QuestionLike.question_id, ids)
    liked = user_flags(db, QuestionLike, "question_id", ids, user_id)
    bookmarked = user_flags(db, QuestionBookmark, "question_id", ids, user_id)
    followed = user_flags(db, QuestionFollower, "question_id", ids, user_id)
    authors = AuthorDirectory(db, {question.author_id for question in questions})
    return [
        QuestionRead(
            id=question.id,
            author_id=question.author_id,
            title=question.title,
            content=question.content,
            destination_id=question.destination_id,
            category=question.category,
            view_count=question.view_count,
            created_at=question.created_at,
            updated_at=question.updated_at,
            author=authors.profile(question.author),
            destination=DestinationRead.model_validate(question.destination) if question.destination else None,
            tags=[tag.name for tag in question.tags],
            answer_count=answer_counts.get(question.id, 0),
            like_count=like_counts.get(question.id, 0),
            liked=question.id in liked,
            bookmarked=question.id in bookmarked,
            followed=question.id in followed,
        )
        for question in questions
    ]


def question_read(db: Session, question: ForumQuestion, user_id: UUID | None) -> QuestionRead:
    return question_reads(db, [question], user_id)[0]


def answer_reads(db: Session, answers: list[ForumAnswer], user_id: UUID | None) -> list[AnswerRead]:
    ids = [answer.id for answer in answers]
    like_counts = grouped_counts(db, AnswerLike.answer_id, ids)
    liked = user_flags(db, AnswerLike, "answer_id", ids, user_id)
    author_ids = {answer.author_id for answer in answers} | {reply.author_id for answer in answers for reply in answer.replies}
    authors = AuthorDirectory(db, author_ids)
    return [
        AnswerRead(
            id=answer.id,
            question_id=answer.question_id,
            author_id=answer.author_id,
            content=answer.content,
            is_ai_generated=answer.is_ai_generated,
            created_at=answer.created_at,
            updated_at=answer.updated_at,
            author=authors.profile(answer.author),
            replies=[
                ReplyRead.model_validate(reply).model_copy(update={"author": authors.profile(reply.author)})
                for reply in sorted(answer.replies, key=lambda item: item.created_at)
            ],
            like_count=like_counts.get(answer.id, 0),
            liked=answer.id in liked,
        )
        for answer in answers
    ]


def question_stmt():
    return select(ForumQuestion).options(
        selectinload(ForumQuestion.author),
        selectinload(ForumQuestion.destination),
        selectinload(ForumQuestion.tags),
    )


def answer_stmt():
    return select(ForumAnswer).options(
        selectinload(ForumAnswer.author),
        selectinload(ForumAnswer.replies).selectinload(ForumReply.author),
    )


def load_question(db: Session, question_id: UUID) -> ForumQuestion:
    question = db.scalar(question_stmt().where(ForumQuestion.id == question_id).execution_options(populate_existing=True))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


# ---- Listing ---------------------------------------------------------------------

def filtered_questions(query: str | None, category: str | None, destination: str | None):
    conditions = []
    if category and category.lower() != "all":
        conditions.append(ForumQuestion.category.ilike(category))
    if destination:
        conditions.append(ForumQuestion.destination.has(Destination.name.ilike(f"%{destination}%")))
    if query:
        term = f"%{query}%"
        conditions.append(or_(
            ForumQuestion.title.ilike(term),
            ForumQuestion.content.ilike(term),
            ForumQuestion.category.ilike(term),
            ForumQuestion.destination.has(Destination.name.ilike(term)),
            ForumQuestion.tags.any(ForumTag.name.ilike(term)),
        ))
    return conditions


def list_question_data(db: Session, query: str | None, category: str | None, destination: str | None, sort: str, page: int, limit: int, user_id: UUID | None):
    conditions = filtered_questions(query, category, destination)
    answer_count = select(func.count(ForumAnswer.id)).where(ForumAnswer.question_id == ForumQuestion.id).correlate(ForumQuestion).scalar_subquery()
    like_count = select(func.count()).select_from(QuestionLike).where(QuestionLike.question_id == ForumQuestion.id).correlate(ForumQuestion).scalar_subquery()

    if sort == "unanswered":
        conditions.append(~ForumQuestion.answers.any())
    order_by = {
        "trending": (ForumQuestion.view_count.desc(), ForumQuestion.created_at.desc()),
        "most_helpful": (like_count.desc(), ForumQuestion.created_at.desc()),
        "most_discussed": (answer_count.desc(), ForumQuestion.created_at.desc()),
    }.get(sort, (ForumQuestion.created_at.desc(),))

    total = db.scalar(select(func.count(ForumQuestion.id)).where(*conditions)) or 0
    ids = db.scalars(
        select(ForumQuestion.id).where(*conditions).order_by(*order_by, ForumQuestion.id).offset((page - 1) * limit).limit(limit)
    ).all()
    by_id = {row.id: row for row in db.scalars(question_stmt().where(ForumQuestion.id.in_(ids))).all()} if ids else {}
    questions = [by_id[item] for item in ids if item in by_id]
    return {"items": question_reads(db, questions, user_id), "page": page, "limit": limit, "total": total}


def _user_id(current_user: AuthenticatedUser | None) -> UUID | None:
    return current_user.id if current_user else None


@router.get("/questions", summary="List forum questions")
def list_questions(query: str | None = Query(None, max_length=200), category: str | None = Query(None, max_length=80), destination: str | None = Query(None, max_length=120), sort: SortOption = Query("latest"), page: int = Query(1, ge=1, le=MAX_PAGE), limit: int = Query(20, ge=1, le=100), current_user: AuthenticatedUser | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    return {"data": list_question_data(db, query, category, destination, sort, page, limit, _user_id(current_user))}


@router.get("/search", summary="Search forum questions")
def search_questions(query: str | None = Query(None, max_length=200), category: str | None = Query(None, max_length=80), destination: str | None = Query(None, max_length=120), sort: SortOption = Query("latest"), page: int = Query(1, ge=1, le=MAX_PAGE), limit: int = Query(20, ge=1, le=100), current_user: AuthenticatedUser | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    return {"data": list_question_data(db, query, category, destination, sort, page, limit, _user_id(current_user))}


@router.get("/questions/{question_id}", summary="Get a forum question")
def get_question(question_id: UUID, count_view: bool = Query(True, description="Set false when re-fetching after an interaction"), current_user: AuthenticatedUser | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    if count_view:
        # Atomic increment: concurrent readers can't lose each other's views.
        result = db.execute(update(ForumQuestion).where(ForumQuestion.id == question_id).values(view_count=ForumQuestion.view_count + 1))
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        db.commit()
    question = load_question(db, question_id)
    user_id = _user_id(current_user)
    answers = db.scalars(answer_stmt().where(ForumAnswer.question_id == question_id).order_by(ForumAnswer.created_at)).unique().all()
    return {"data": QuestionBundle(question=question_read(db, question, user_id), answers=answer_reads(db, list(answers), user_id))}


def tags_for(db: Session, names: list[str]) -> list[ForumTag]:
    result = []
    seen = set()
    for raw in names:
        name = raw.strip()[:80]
        key = name.casefold()
        if not name or key in seen:
            continue
        seen.add(key)
        tag = db.scalar(select(ForumTag).where(func.lower(ForumTag.name) == key))
        if not tag:
            tag = ForumTag(name=name)
            db.add(tag)
            db.flush()
        result.append(tag)
    return result


def resolve_destination_id(db: Session, destination_id: UUID | None, destination_name: str | None) -> UUID | None:
    if destination_id is not None:
        ensure_exists(db, Destination, destination_id, "Destination")
        return destination_id
    if destination_name:
        return db.scalar(select(Destination.id).where(Destination.name.ilike(destination_name)).limit(1))
    return None


@router.post("/questions", status_code=status.HTTP_201_CREATED, summary="Create a forum question", dependencies=[Depends(check_content_write_rate_limit)])
def create_question(payload: QuestionCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    destination_id = resolve_destination_id(db, payload.destination_id, payload.destination)
    question = ForumQuestion(author_id=profile.id, title=payload.title, content=payload.content, destination_id=destination_id, category=payload.category)
    question.tags = tags_for(db, payload.tags)
    db.add(question)
    db.commit()
    return {"data": question_read(db, load_question(db, question.id), profile.id)}


@router.patch("/questions/{question_id}", summary="Edit an owned forum question")
def update_question(question_id: UUID, payload: QuestionUpdate, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    question = load_question(db, question_id)
    if question.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the question author can modify it")
    values = payload.model_dump(exclude_unset=True)
    tag_names = values.pop("tags", None)
    destination_name = values.pop("destination", None)
    if "destination_id" in values or destination_name is not None:
        values["destination_id"] = resolve_destination_id(db, values.get("destination_id"), destination_name)
    for key, value in values.items():
        setattr(question, key, value)
    if tag_names is not None:
        question.tags = tags_for(db, tag_names)
    db.commit()
    return {"data": question_read(db, load_question(db, question_id), current_user.id)}


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned forum question")
def delete_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    question = db.get(ForumQuestion, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the question author can delete it")
    db.delete(question)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def load_answer(db: Session, answer_id: UUID) -> ForumAnswer:
    return db.scalar(answer_stmt().where(ForumAnswer.id == answer_id).execution_options(populate_existing=True))


@router.post("/questions/{question_id}/answers", status_code=status.HTTP_201_CREATED, summary="Answer a forum question", dependencies=[Depends(check_content_write_rate_limit)])
def create_answer(question_id: UUID, payload: AnswerCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if not db.get(ForumQuestion, question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    answer = ForumAnswer(question_id=question_id, author_id=profile.id, content=payload.content, is_ai_generated=False)
    db.add(answer)
    db.commit()
    return {"data": answer_reads(db, [load_answer(db, answer.id)], profile.id)[0]}


@router.patch("/answers/{answer_id}", summary="Edit an owned forum answer")
def update_answer(answer_id: UUID, payload: AnswerCreate, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    answer = db.get(ForumAnswer, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the answer author can modify it")
    answer.content = payload.content
    db.commit()
    return {"data": answer_reads(db, [load_answer(db, answer_id)], current_user.id)[0]}


@router.delete("/answers/{answer_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned forum answer")
def delete_answer(answer_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    answer = db.get(ForumAnswer, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the answer author can delete it")
    db.delete(answer)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/answers/{answer_id}/replies", status_code=status.HTTP_201_CREATED, summary="Reply to a forum answer", dependencies=[Depends(check_content_write_rate_limit)])
def create_reply(answer_id: UUID, payload: ReplyCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if not db.get(ForumAnswer, answer_id):
        raise HTTPException(status_code=404, detail="Answer not found")
    reply = ForumReply(answer_id=answer_id, author_id=profile.id, content=payload.content)
    db.add(reply)
    db.commit()
    reply = db.scalar(select(ForumReply).options(selectinload(ForumReply.author)).where(ForumReply.id == reply.id))
    authors = AuthorDirectory(db, {reply.author_id})
    return {"data": ReplyRead.model_validate(reply).model_copy(update={"author": authors.profile(reply.author)})}


def toggle(db: Session, model, key: str, resource_id: UUID, user_id: UUID) -> bool:
    """Flip a (resource, user) marker. Safe against double clicks: a concurrent insert
    of the same primary key is treated as 'already on'."""
    row = db.scalar(select(model).where(getattr(model, key) == resource_id, model.user_id == user_id))
    if row:
        db.delete(row)
        db.commit()
        return False
    db.add(model(**{key: resource_id, "user_id": user_id}))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return True


def remove_marker(db: Session, model, key: str, resource_id: UUID, user_id: UUID) -> None:
    db.execute(delete(model).where(getattr(model, key) == resource_id, model.user_id == user_id))
    db.commit()


def require_question(db: Session, question_id: UUID) -> None:
    if not db.get(ForumQuestion, question_id):
        raise HTTPException(status_code=404, detail="Question not found")


@router.post("/questions/{question_id}/like", summary="Toggle a question like")
def like_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    require_question(db, question_id)
    return {"data": {"liked": toggle(db, QuestionLike, "question_id", question_id, current_user.id)}}


@router.delete("/questions/{question_id}/like", summary="Unlike a question")
def unlike_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    remove_marker(db, QuestionLike, "question_id", question_id, current_user.id)
    return {"data": {"liked": False}}


@router.post("/answers/{answer_id}/like", summary="Toggle an answer like")
def like_answer(answer_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    if not db.get(ForumAnswer, answer_id):
        raise HTTPException(status_code=404, detail="Answer not found")
    return {"data": {"liked": toggle(db, AnswerLike, "answer_id", answer_id, current_user.id)}}


@router.delete("/answers/{answer_id}/like", summary="Unlike an answer")
def unlike_answer(answer_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    remove_marker(db, AnswerLike, "answer_id", answer_id, current_user.id)
    return {"data": {"liked": False}}


@router.post("/questions/{question_id}/bookmark", summary="Toggle a question bookmark")
def bookmark_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    require_question(db, question_id)
    return {"data": {"bookmarked": toggle(db, QuestionBookmark, "question_id", question_id, current_user.id)}}


@router.delete("/questions/{question_id}/bookmark", summary="Remove a question bookmark")
def unbookmark_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    remove_marker(db, QuestionBookmark, "question_id", question_id, current_user.id)
    return {"data": {"bookmarked": False}}


@router.post("/questions/{question_id}/follow", summary="Toggle following a question")
def follow_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    require_question(db, question_id)
    return {"data": {"followed": toggle(db, QuestionFollower, "question_id", question_id, current_user.id)}}


@router.delete("/questions/{question_id}/follow", summary="Unfollow a question")
def unfollow_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_active_user), db: Session = Depends(get_db)):
    remove_marker(db, QuestionFollower, "question_id", question_id, current_user.id)
    return {"data": {"followed": False}}


@router.get("/trending", summary="List trending questions")
def trending(current_user: AuthenticatedUser | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    return {"data": list_question_data(db, None, None, None, "trending", 1, 20, _user_id(current_user))}


@router.get("/latest", summary="List latest questions")
def latest(current_user: AuthenticatedUser | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    return {"data": list_question_data(db, None, None, None, "latest", 1, 20, _user_id(current_user))}


@router.get("/unanswered", summary="List unanswered questions")
def unanswered(current_user: AuthenticatedUser | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    return {"data": list_question_data(db, None, None, None, "unanswered", 1, 20, _user_id(current_user))}


@router.get("/questions/{question_id}/similar", summary="Find similar questions")
def similar(question_id: UUID, current_user: AuthenticatedUser | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    question = db.get(ForumQuestion, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    rows = db.scalars(
        question_stmt()
        .where(ForumQuestion.id != question_id, ForumQuestion.category == question.category)
        .order_by(ForumQuestion.view_count.desc(), ForumQuestion.created_at.desc())
        .limit(4)
    ).all()
    return {"data": question_reads(db, list(rows), _user_id(current_user))}
