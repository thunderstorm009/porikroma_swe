from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
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
)
from app.schemas import (
    AnswerCreate,
    AnswerRead,
    DestinationRead,
    QuestionBundle,
    QuestionCreate,
    QuestionRead,
    QuestionUpdate,
    ProfileRead,
    ReplyCreate,
    ReplyRead,
)

router = APIRouter(prefix="/forum", tags=["Forum"])


def question_stmt():
    return select(ForumQuestion).options(
        selectinload(ForumQuestion.author),
        selectinload(ForumQuestion.destination),
        selectinload(ForumQuestion.tags),
        selectinload(ForumQuestion.answers),
        selectinload(ForumQuestion.likes),
        selectinload(ForumQuestion.bookmarks),
        selectinload(ForumQuestion.followers),
    )


def question_read(question: ForumQuestion, user_id: UUID | None = None) -> QuestionRead:
    liked_by = any(item.user_id == user_id for item in question.likes) if user_id else False
    bookmarked = any(item.user_id == user_id for item in question.bookmarks) if user_id else False
    followed = any(item.user_id == user_id for item in question.followers) if user_id else False
    author = public_profile(question.author)
    return QuestionRead(
        id=question.id,
        author_id=question.author_id,
        title=question.title,
        content=question.content,
        destination_id=question.destination_id,
        category=question.category,
        view_count=question.view_count,
        created_at=question.created_at,
        updated_at=question.updated_at,
        author=author,
        destination=DestinationRead.model_validate(question.destination) if question.destination else None,
        tags=[tag.name for tag in question.tags],
        answer_count=len(question.answers),
        like_count=len(question.likes),
        bookmarked=bookmarked,
        followed=followed,
    )


def answer_read(answer: ForumAnswer) -> AnswerRead:
    return AnswerRead(
        id=answer.id,
        question_id=answer.question_id,
        author_id=answer.author_id,
        content=answer.content,
        is_ai_generated=answer.is_ai_generated,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
        author=public_profile(answer.author),
        replies=[ReplyRead.model_validate(reply).model_copy(update={"author": public_profile(reply.author)}) for reply in answer.replies],
        like_count=len(answer.likes),
    )


def public_profile(profile: Profile | None):
    if profile is None:
        return None
    roles = {assignment.role.name for assignment in profile.roles if assignment.revoked_at is None}
    role = next((item for item in ("platform_admin", "provider", "tour_planner", "traveler") if item in roles), "traveler")
    return ProfileRead.model_validate(profile).model_copy(update={
        "role": role,
        "contribution_count": len(profile.forum_questions) + len(profile.forum_answers),
    })


def answer_stmt():
    return select(ForumAnswer).options(
        selectinload(ForumAnswer.author),
        selectinload(ForumAnswer.replies).selectinload(ForumReply.author),
        selectinload(ForumAnswer.likes),
    )


def apply_question_filters(stmt, query: str | None, category: str | None, destination: str | None):
    if category and category.lower() != "all":
        stmt = stmt.where(ForumQuestion.category.ilike(category))
    if destination:
        stmt = stmt.join(ForumQuestion.destination).where(Destination.name.ilike(f"%{destination}%"))
    if query:
        term = f"%{query}%"
        stmt = stmt.outerjoin(ForumQuestion.destination).where(or_(ForumQuestion.title.ilike(term), ForumQuestion.content.ilike(term), ForumQuestion.category.ilike(term), Destination.name.ilike(term), ForumQuestion.tags.any(ForumTag.name.ilike(term))))
    return stmt


def list_question_data(db: Session, query: str | None, category: str | None, destination: str | None, sort: str, page: int, limit: int, user_id: UUID | None):
    stmt = apply_question_filters(question_stmt(), query, category, destination)
    if sort in {"trending", "most_helpful", "most_discussed"}:
        stmt = stmt.order_by(ForumQuestion.view_count.desc(), ForumQuestion.created_at.desc())
    else:
        stmt = stmt.order_by(ForumQuestion.created_at.desc())
    questions = db.scalars(stmt.distinct()).unique().all()
    if sort == "unanswered":
        questions = [item for item in questions if not item.answers]
    elif sort == "most_helpful":
        questions.sort(key=lambda item: len(item.likes), reverse=True)
    elif sort == "most_discussed":
        questions.sort(key=lambda item: len(item.answers), reverse=True)
    total = len(questions)
    rows = questions[(page - 1) * limit: page * limit]
    return {"items": [question_read(item, user_id) for item in rows], "page": page, "limit": limit, "total": total}


@router.get("/questions", summary="List forum questions")
def list_questions(query: str | None = Query(None, max_length=200), category: str | None = Query(None, max_length=80), destination: str | None = Query(None, max_length=120), sort: str = Query("latest"), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return {"data": list_question_data(db, query, category, destination, sort, page, limit, None)}


@router.get("/search", summary="Search forum questions")
def search_questions(query: str | None = Query(None, max_length=200), category: str | None = Query(None, max_length=80), destination: str | None = Query(None, max_length=120), sort: str = Query("latest"), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return {"data": list_question_data(db, query, category, destination, sort, page, limit, None)}


@router.get("/questions/{question_id}", summary="Get a forum question")
def get_question(question_id: UUID, db: Session = Depends(get_db)):
    question = db.scalar(question_stmt().where(ForumQuestion.id == question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.view_count += 1
    db.commit()
    answers = db.scalars(answer_stmt().where(ForumAnswer.question_id == question_id).order_by(ForumAnswer.created_at)).unique().all()
    return {"data": QuestionBundle(question=question_read(question), answers=[answer_read(item) for item in answers])}


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


@router.post("/questions", status_code=status.HTTP_201_CREATED, summary="Create a forum question")
def create_question(payload: QuestionCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    destination_id = payload.destination_id
    if destination_id is None and payload.destination:
        destination = db.scalar(select(Destination).where(Destination.name.ilike(payload.destination)))
        destination_id = destination.id if destination else None
    question = ForumQuestion(author_id=profile.id, title=payload.title, content=payload.content, destination_id=destination_id, category=payload.category)
    question.tags = tags_for(db, payload.tags)
    db.add(question)
    db.commit()
    question = db.scalar(question_stmt().where(ForumQuestion.id == question.id))
    return {"data": question_read(question, profile.id)}


@router.patch("/questions/{question_id}", summary="Edit an owned forum question")
def update_question(question_id: UUID, payload: QuestionUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    question = db.scalar(question_stmt().where(ForumQuestion.id == question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the question author can modify it")
    values = payload.model_dump(exclude_unset=True)
    tag_names = values.pop("tags", None)
    destination_name = values.pop("destination", None)
    if destination_name is not None and values.get("destination_id") is None:
        destination = db.scalar(select(Destination).where(Destination.name.ilike(destination_name)))
        values["destination_id"] = destination.id if destination else None
    for key, value in values.items():
        setattr(question, key, value)
    if tag_names is not None:
        question.tags = tags_for(db, tag_names)
    db.commit()
    return {"data": question_read(question, current_user.id)}


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned forum question")
def delete_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    question = db.get(ForumQuestion, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the question author can delete it")
    db.delete(question)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/questions/{question_id}/answers", status_code=status.HTTP_201_CREATED, summary="Answer a forum question")
def create_answer(question_id: UUID, payload: AnswerCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if not db.get(ForumQuestion, question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    answer = ForumAnswer(question_id=question_id, author_id=profile.id, content=payload.content, is_ai_generated=False)
    db.add(answer)
    db.commit()
    db.refresh(answer)
    answer = db.scalar(answer_stmt().where(ForumAnswer.id == answer.id))
    return {"data": answer_read(answer)}


@router.patch("/answers/{answer_id}", summary="Edit an owned forum answer")
def update_answer(answer_id: UUID, payload: AnswerCreate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    answer = db.get(ForumAnswer, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the answer author can modify it")
    answer.content = payload.content
    db.commit()
    answer = db.scalar(answer_stmt().where(ForumAnswer.id == answer.id))
    return {"data": answer_read(answer)}


@router.delete("/answers/{answer_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned forum answer")
def delete_answer(answer_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    answer = db.get(ForumAnswer, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the answer author can delete it")
    db.delete(answer)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/answers/{answer_id}/replies", status_code=status.HTTP_201_CREATED, summary="Reply once to a forum answer")
def create_reply(answer_id: UUID, payload: ReplyCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if not db.get(ForumAnswer, answer_id):
        raise HTTPException(status_code=404, detail="Answer not found")
    reply = ForumReply(answer_id=answer_id, author_id=profile.id, content=payload.content)
    db.add(reply)
    db.commit()
    db.refresh(reply)
    reply = db.scalar(select(ForumReply).options(selectinload(ForumReply.author)).where(ForumReply.id == reply.id))
    return {"data": ReplyRead.model_validate(reply).model_copy(update={"author": public_profile(reply.author)})}


def toggle(db: Session, model, key: str, resource_id: UUID, user_id: UUID):
    row = db.scalar(select(model).where(getattr(model, key) == resource_id, model.user_id == user_id))
    if row:
        db.delete(row)
        enabled = False
    else:
        db.add(model(**{key: resource_id, "user_id": user_id}))
        enabled = True
    db.commit()
    return enabled


@router.post("/questions/{question_id}/like", summary="Like a question")
def like_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(ForumQuestion, question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    return {"data": {"liked": toggle(db, QuestionLike, "question_id", question_id, current_user.id)}}


@router.delete("/questions/{question_id}/like", summary="Unlike a question")
def unlike_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(QuestionLike).where(QuestionLike.question_id == question_id, QuestionLike.user_id == current_user.id))
    db.commit()
    return {"data": {"liked": False}}


@router.post("/answers/{answer_id}/like", summary="Like an answer")
def like_answer(answer_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(ForumAnswer, answer_id):
        raise HTTPException(status_code=404, detail="Answer not found")
    return {"data": {"liked": toggle(db, AnswerLike, "answer_id", answer_id, current_user.id)}}


@router.delete("/answers/{answer_id}/like", summary="Unlike an answer")
def unlike_answer(answer_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(AnswerLike).where(AnswerLike.answer_id == answer_id, AnswerLike.user_id == current_user.id))
    db.commit()
    return {"data": {"liked": False}}


@router.post("/questions/{question_id}/bookmark", summary="Bookmark a question")
def bookmark_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(ForumQuestion, question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    return {"data": {"bookmarked": toggle(db, QuestionBookmark, "question_id", question_id, current_user.id)}}


@router.delete("/questions/{question_id}/bookmark", summary="Remove a question bookmark")
def unbookmark_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(QuestionBookmark).where(QuestionBookmark.question_id == question_id, QuestionBookmark.user_id == current_user.id))
    db.commit()
    return {"data": {"bookmarked": False}}


@router.post("/questions/{question_id}/follow", summary="Follow a question")
def follow_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(ForumQuestion, question_id):
        raise HTTPException(status_code=404, detail="Question not found")
    return {"data": {"followed": toggle(db, QuestionFollower, "question_id", question_id, current_user.id)}}


@router.delete("/questions/{question_id}/follow", summary="Unfollow a question")
def unfollow_question(question_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(QuestionFollower).where(QuestionFollower.question_id == question_id, QuestionFollower.user_id == current_user.id))
    db.commit()
    return {"data": {"followed": False}}


@router.get("/trending", summary="List trending questions")
def trending(db: Session = Depends(get_db)):
    return {"data": list_question_data(db, None, None, None, "trending", 1, 20, None)}


@router.get("/latest", summary="List latest questions")
def latest(db: Session = Depends(get_db)):
    return {"data": list_question_data(db, None, None, None, "latest", 1, 20, None)}


@router.get("/unanswered", summary="List unanswered questions")
def unanswered(db: Session = Depends(get_db)):
    return {"data": list_question_data(db, None, None, None, "unanswered", 1, 20, None)}


@router.get("/questions/{question_id}/similar", summary="Find similar questions")
def similar(question_id: UUID, db: Session = Depends(get_db)):
    question = db.scalar(question_stmt().where(ForumQuestion.id == question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    stmt = question_stmt().where(ForumQuestion.id != question_id, ForumQuestion.category == question.category)
    rows = db.scalars(stmt.limit(4)).unique().all()
    return {"data": [question_read(item) for item in rows]}
