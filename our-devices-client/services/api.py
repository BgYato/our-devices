import requests

class ApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token = None

    def set_token(self, token: str):
        self.token = token

    def _headers(self):
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def get(self, endpoint: str, params: dict = None):
        url = f"{self.base_url}{endpoint}"
        resp = requests.get(url, headers=self._headers(), params=params)
        resp.raise_for_status()
        return resp.json()

    def post(self, endpoint: str, data: dict = None, params: dict = None):
        url = f"{self.base_url}{endpoint}"
        resp = requests.post(url, json=data, headers=self._headers(), params=params)
        resp.raise_for_status()
        return resp.json()

    def put(self, endpoint: str, data: dict = None, params: dict = None):
        url = f"{self.base_url}{endpoint}"
        resp = requests.put(url, json=data, headers=self._headers(), params=params)
        resp.raise_for_status()
        return resp.json()

    def delete(self, endpoint: str, params: dict = None):
        url = f"{self.base_url}{endpoint}"
        resp = requests.delete(url, headers=self._headers(), params=params)
        resp.raise_for_status()
        return resp.json() if resp.text else {}
