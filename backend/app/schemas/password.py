from typing import Annotated

from pydantic import AfterValidator, Field


def validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("A senha deve ter pelo menos 8 caracteres")
    if len(value) > 72:
        raise ValueError("A senha deve ter no máximo 72 caracteres")
    if not any(c.isupper() for c in value):
        raise ValueError("A senha deve conter uma letra maiúscula")
    if not any(c.islower() for c in value):
        raise ValueError("A senha deve conter uma letra minúscula")
    if not any(c.isdigit() for c in value):
        raise ValueError("A senha deve conter um número")
    return value


Password = Annotated[
    str,
    Field(min_length=8, max_length=72),
    AfterValidator(validate_password_strength),
]
