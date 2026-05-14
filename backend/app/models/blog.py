from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    kind = Column(String(20), nullable=False)  # 'external' | 'internal'
    title = Column(String(200), nullable=False)
    summary = Column(String(300), nullable=False)
    image_url = Column(String(500), nullable=True)
    image_is_external = Column(Boolean, nullable=False, default=False)
    body_md = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=True)
    source_name = Column(String(120), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    published = Column(Boolean, nullable=False, default=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    likes_count = Column(Integer, nullable=False, server_default="0", default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User")


class BlogPostLike(Base):
    """Dedup table — uma curtida por (post, IP hasheado). O IP nunca é
    armazenado em claro: salvamos HMAC-SHA256(ip, JWT_SECRET), irreversível
    para fins de conformidade com a LGPD."""
    __tablename__ = "blog_post_likes"
    __table_args__ = (
        UniqueConstraint("post_id", "ip_hash", name="uq_blog_post_likes_post_ip"),
    )

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
