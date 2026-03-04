import string
from typing import Any

from sqlalchemy.ext.declarative import as_declarative, declared_attr


@as_declarative()
class Base:
    id: Any
    __name__: str

    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.camelcase_to_snakecase(cls.__name__).lower()

    @staticmethod
    def camelcase_to_snakecase(str):
        res = [str[0].lower()]
        for c in str[1:]:
            if c in string.ascii_uppercase:
                res.append("_")
                res.append(c.lower())
            else:
                res.append(c)

        return "".join(res)