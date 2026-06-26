import datetime
import random

from fastapi import APIRouter

router = APIRouter(tags=["quotes"])

DAILY_QUOTES = [
    "O segredo do sucesso é começar.",
    "Acredite que você pode, e você já está no meio do caminho.",
    "A única forma de fazer um excelente trabalho é amar o que você faz.",
    "Não espere. O tempo nunca será perfeito.",
    "A jornada de mil milhas começa com um único passo.",
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "A persistência é o caminho do êxito.",
    "Grandes realizações nascem de grandes sonhos.",
    "Tudo o que você pode imaginar é real.",
    "O futuro pertence àqueles que acreditam na beleza de seus sonhos.",
    "A vida é 10% do que acontece e 90% de como reagimos.",
    "Você nunca sabe a força que tem, até que ser forte é a única escolha.",
    "O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta.",
    "Se você pode sonhar, você pode fazer.",
    "A melhor maneira de prever o futuro é criá-lo.",
    "Pequenas ações diárias levam a grandes resultados.",
    "O otimismo é a fé que leva à realização.",
    "A disciplina é a ponte entre metas e realizações.",
    "Faça hoje o que outros não querem, para ter amanhã o que outros não têm.",
    "O conhecimento é a única coisa que ninguém pode tirar de você.",
    "Seu único limite é você mesmo.",
    "A sorte favorece os corajosos.",
    "Não há atalhos para qualquer lugar que valha a pena ir.",
    "A melhor vingança é o sucesso em massa.",
    "Ações falam mais alto que palavras.",
]


@router.get("/api/v1/quotes/daily")
def get_daily_quote():
    today = datetime.date.today()
    rng = random.Random(today.isoformat())
    quote = rng.choice(DAILY_QUOTES)
    return {"quote": quote}
