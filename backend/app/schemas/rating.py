from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=300)


class RatingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    rater_id: int
    ratee_id: int
    score: int
    comment: Optional[str]
    created_at: datetime
