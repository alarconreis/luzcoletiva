from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AssistedProfile(Base):
    """
    Perfil de pessoa real que recebe ajuda mas não tem cadastro digital.
    Criado e gerenciado por admins. Cada perfil pode ter vários pedidos institucionais.
    """
    __tablename__ = "assisted_profiles"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(120), nullable=False)
    city = Column(String(80), nullable=False)
    state = Column(String(2), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    cep = Column(String(8), nullable=True)
    address = Column(Text, nullable=True)
    photo_path = Column(String(255), nullable=False)
    story = Column(Text, nullable=False)
    created_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    archived = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_admin_id])
    requests = relationship("HelpRequest", back_populates="assisted_profile")
