import hashlib
import time
from typing import Dict, Any, Optional

class MerkleRecord:
    """
    Represents a single record in the tamper-evident append-only Trust Log.
    Each record links to the hash of the previous record forming a cryptographic hash chain.
    """
    def __init__(
        self,
        index: int,
        call_id: str,
        transcript: str,
        risk_score: float,
        action: str,
        timestamp: Optional[float] = None,
        previous_hash: str = "0" * 64,
        record_hash: Optional[str] = None
    ):
        self.index = index
        self.call_id = call_id
        self.transcript = transcript
        self.risk_score = round(float(risk_score), 2)
        self.action = action
        self.timestamp = timestamp if timestamp is not None else time.time()
        self.previous_hash = previous_hash
        
        # Calculate SHA-256 hash if not provided
        if record_hash:
            self.record_hash = record_hash
        else:
            self.record_hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        """
        Computes the canonical SHA-256 hash over the record's attributes.
        """
        payload = f"{self.index}|{self.call_id}|{self.transcript}|{self.risk_score:.2f}|{self.action}|{self.timestamp:.4f}|{self.previous_hash}"
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "call_id": self.call_id,
            "transcript": self.transcript,
            "risk_score": self.risk_score,
            "action": self.action,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "record_hash": self.record_hash
        }


class TrustLogger:
    """
    Append-only Merkle-style Trust Logger.
    Maintains an in-memory/DB synchronized ledger of cryptographic records.
    """
    def __init__(self):
        self.chain = []

    def get_latest_hash(self) -> str:
        if not self.chain:
            return "0" * 64
        return self.chain[-1].record_hash

    def append_record(
        self,
        call_id: str,
        transcript: str,
        risk_score: float,
        action: str,
        timestamp: Optional[float] = None
    ) -> MerkleRecord:
        index = len(self.chain)
        prev_hash = self.get_latest_hash()
        
        record = MerkleRecord(
            index=index,
            call_id=call_id,
            transcript=transcript,
            risk_score=risk_score,
            action=action,
            timestamp=timestamp,
            previous_hash=prev_hash
        )
        self.chain.append(record)
        return record
