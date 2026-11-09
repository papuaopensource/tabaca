from .bbc import BBCAdapter
from .theconversation import TheConversationAdapter
from .jubi import JubiAdapter
from .antara_papua import AntaraPapuaAdapter

_REGISTRY = {
    "bbc": BBCAdapter,
    "theconversation": TheConversationAdapter,
    "jubi": JubiAdapter,
    "antara-papua": AntaraPapuaAdapter,
}


def get_adapter(source_id: str):
    cls = _REGISTRY.get(source_id)
    if cls is None:
        raise ValueError(f"Unknown source: {source_id}")
    return cls()
