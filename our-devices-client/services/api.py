import requests
import logging
from typing import Any


class ApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.token: str | None = None

    def set_token(self, token: str) -> None:
        """Guarda el token JWT"""
        self.token = token
        logging.info("🔑 Token de sesión configurado.")

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _handle_response(self, resp: requests.Response) -> Any:
        """Maneja y valida respuestas HTTP"""
        try:
            resp.raise_for_status()
            if resp.text:
                return resp.json()
            return {}
        except requests.exceptions.RequestException as e:
            logging.error(f"❌ Error en petición: {e}\n→ {resp.text}")
            raise Exception(resp.text or str(e))

    def get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"🔹 GET {url} | params={params}")
        resp = requests.get(url, headers=self._headers(), params=params)
        return self._handle_response(resp)

    def post(
        self,
        endpoint: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"🟢 POST {url} | data={data}")
        resp = requests.post(url, json=data, headers=self._headers(), params=params)
        return self._handle_response(resp)

    def put(
        self,
        endpoint: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"🟠 PUT {url} | data={data}")
        resp = requests.put(url, json=data, headers=self._headers(), params=params)
        return self._handle_response(resp)

    def delete(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"🔴 DELETE {url} | params={params}")
        resp = requests.delete(url, headers=self._headers(), params=params)
        return self._handle_response(resp)
