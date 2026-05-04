"""
Rota de histórias inspiradoras — mock para o MVP.
Endpoint público (não exige autenticação).
"""
from fastapi import APIRouter

from app.schemas.user import StoryOut

router = APIRouter(prefix="/api", tags=["stories"])

_PLACEHOLDER_YELLOW = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23FFF9C4'/%3E%3Cstop offset='100%25' stop-color='%23FFD54F'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3C/svg%3E"
_PLACEHOLDER_BLUE   = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23E0F2FE'/%3E%3Cstop offset='100%25' stop-color='%234FC3F7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3C/svg%3E"
_PLACEHOLDER_GREEN  = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23DCFCE7'/%3E%3Cstop offset='100%25' stop-color='%2381C784'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3C/svg%3E"

_STORIES = [
    {
        "id": 1,
        "title": "Uma cesta, um recomeço",
        "excerpt": "Dona Marlene recebeu apoio de vizinhos durante a pandemia e hoje ajuda outras 12 famílias do bairro.",
        "author": "Marlene S., 62",
        "image_url": _PLACEHOLDER_YELLOW,
        "category": "Comunidade",
    },
    {
        "id": 2,
        "title": "Aulas que mudaram um futuro",
        "excerpt": "Carlos, estudante de engenharia, oferece reforço gratuito e já preparou 8 jovens para o vestibular.",
        "author": "Carlos M., 22",
        "image_url": _PLACEHOLDER_BLUE,
        "category": "Educação",
    },
    {
        "id": 3,
        "title": "Um abraço a quem cuida",
        "excerpt": "Grupo de voluntárias revezam visitas a idosos sozinhos. 'Levamos café e ficamos', diz Helena.",
        "author": "Helena P., 45",
        "image_url": _PLACEHOLDER_GREEN,
        "category": "Acolhimento",
    },
]


@router.get("/stories", response_model=list[StoryOut])
def list_stories():
    return _STORIES
