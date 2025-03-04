from typing import Dict, Union, Any


class ElasticsearchException(Exception): ...

class TransportError(ElasticsearchException):
    @property
    def status_code(self) -> Union[str, int]: ...
    @property
    def error(self) -> str: ...
    @property
    def info(self) -> Union[Dict[str, Any], Exception, Any]: ...
    def __str__(self) -> str: ...

class NotFoundError(TransportError): ...
