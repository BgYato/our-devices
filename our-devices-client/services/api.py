import requests
import logging
from typing import Any


class ApiClient:
    REQUEST_TIMEOUT_SECONDS = 10

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.token: str | None = None

    def set_token(self, token: str) -> None:
        """Guarda el token JWT"""
        self.token = token
        logging.info("Token de sesión configurado.")

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _handle_response(self, resp: requests.Response) -> Any:
        """Maneja y valida respuestas HTTP"""
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            try:
                error_body = resp.json()
                if isinstance(error_body, dict):
                    message = error_body.get("description") or error_body.get("message")
                else:
                    message = None
            except ValueError:
                message = None
            logging.error(
                "La API respondió HTTP %s%s",
                resp.status_code,
                f": {message}" if message else "",
            )
            raise
        if resp.text:
            return resp.json()
        return {}

    def get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"GET {url} | params={params}")
        resp = requests.get(
            url,
            headers=self._headers(),
            params=params,
            timeout=self.REQUEST_TIMEOUT_SECONDS,
        )
        return self._handle_response(resp)

    def post(
        self,
        endpoint: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        timeout: int = REQUEST_TIMEOUT_SECONDS,
    ) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"POST {url}")
        resp = requests.post(
            url,
            json=data,
            headers=self._headers(),
            params=params,
            timeout=timeout,
        )
        return self._handle_response(resp)

    def put(
        self,
        endpoint: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"PUT {url}")
        resp = requests.put(
            url,
            json=data,
            headers=self._headers(),
            params=params,
            timeout=self.REQUEST_TIMEOUT_SECONDS,
        )
        return self._handle_response(resp)

    def delete(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{endpoint}"
        logging.info(f"DELETE {url} | params={params}")
        resp = requests.delete(
            url,
            headers=self._headers(),
            params=params,
            timeout=self.REQUEST_TIMEOUT_SECONDS,
        )
        return self._handle_response(resp)
