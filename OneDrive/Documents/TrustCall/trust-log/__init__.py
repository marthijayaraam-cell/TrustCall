# Trust Log Package initialization
try:
    from .trust_logger import TrustLogger, MerkleRecord
    from .verifier import LogVerifier
except ImportError:
    from trust_logger import TrustLogger, MerkleRecord
    from verifier import LogVerifier

__all__ = ["TrustLogger", "MerkleRecord", "LogVerifier"]
