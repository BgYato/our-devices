import json
from typing import Tuple
from services.api import ApiClient


class AuthService:
    def __init__(self, api: ApiClient, endpoints: dict):
        self.api = api
        self.endpoints = endpoints

    def login(self, identifier: str, password: str) -> str:
        """
        Hace login y devuelve únicamente el JWT.
        """
        data = {"identifier": identifier, "password": password}
        res = self.api.post(self.endpoints["login"], data)

        token = res.get("token")
        if not token:
            raise ValueError("Login sin token válido en la respuesta")

        self.api.set_token(token)

        return token

    def me(self) -> dict:
        """
        Usa el JWT ya guardado en ApiClient y obtiene la info del usuario.
        """
        return self.api.get(self.endpoints["me"])
