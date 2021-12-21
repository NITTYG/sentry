from __future__ import annotations

from typing import Sequence
from urllib.parse import urlparse

from requests.exceptions import RequestException
from rest_framework.request import Request
from rest_framework.response import Response

from .base import ApiError

__all__ = ("ApiError",)


class ApiHostError(ApiError):
    code = 503

    @classmethod
    def from_exception(cls, exception: RequestException) -> ApiHostError:
        if getattr(exception, "request"):
            return cls.from_request(exception.request)
        return cls("Unable to reach host")

    @classmethod
    def from_request(cls, request: Request) -> ApiHostError:
        host = urlparse(request.url).netloc
        return cls(f"Unable to reach host: {host}")


class ApiTimeoutError(ApiError):
    code = 504

    @classmethod
    def from_exception(cls, exception: RequestException) -> ApiTimeoutError:
        if getattr(exception, "request"):
            return cls.from_request(exception.request)
        return cls("Timed out reaching host")

    @classmethod
    def from_request(cls, request: Request) -> ApiTimeoutError:
        host = urlparse(request.url).netloc
        return cls(f"Timed out attempting to reach host: {host}")


class ApiUnauthorized(ApiError):
    code = 401


class ApiRateLimitedError(ApiError):
    code = 429


class UnsupportedResponseType(ApiError):
    @property
    def content_type(self) -> str:
        return self.text


class IntegrationError(Exception):
    pass


class IntegrationProviderError(Exception):
    """Nonfatal errors generated by an external provider"""

    pass


class DuplicateDisplayNameError(IntegrationError):
    pass


class IntegrationFormError(IntegrationError):
    def __init__(self, field_errors: Sequence[Exception]):
        super().__init__("Invalid integration action")
        self.field_errors = field_errors


class IgnorableSentryAppError(RequestException):
    pass


class ClientError(RequestException):
    """4xx Error Occurred"""

    def __init__(self, status_code: str, url: str, response: Response | None = None) -> None:
        http_error_msg = f"{status_code} Client Error: for url: {url}"
        super().__init__(http_error_msg, response=response)
