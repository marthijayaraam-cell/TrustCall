from typing import Dict, Any, List, Tuple
try:
    from .trust_logger import MerkleRecord
except ImportError:
    from trust_logger import MerkleRecord

class LogVerifier:
    """
    Verifies the integrity of single records or an entire Merkle hash chain.
    """

    @staticmethod
    def verify_single_record(record_dict: Dict[str, Any]) -> Tuple[bool, str, str]:
        """
        Recomputes the hash of a record payload and checks if it matches stored_hash.
        Returns: (is_valid, stored_hash, recomputed_hash)
        """
        try:
            record = MerkleRecord(
                index=int(record_dict["index"]),
                call_id=str(record_dict["call_id"]),
                transcript=str(record_dict["transcript"]),
                risk_score=float(record_dict["risk_score"]),
                action=str(record_dict["action"]),
                timestamp=float(record_dict["timestamp"]),
                previous_hash=str(record_dict.get("previous_hash", "0" * 64)),
                record_hash=None # Force recomputation
            )
            
            recomputed_hash = record.calculate_hash()
            stored_hash = str(record_dict.get("record_hash", ""))
            
            is_valid = (recomputed_hash == stored_hash)
            return is_valid, stored_hash, recomputed_hash
        except Exception as e:
            return False, str(record_dict.get("record_hash", "")), f"ERROR: {str(e)}"

    @staticmethod
    def verify_chain(records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verifies all records and the chain links between them.
        """
        if not records:
            return {"valid": True, "total_records": 0, "broken_index": None, "reason": "Chain is empty"}

        expected_prev_hash = "0" * 64
        
        for idx, rec_dict in enumerate(records):
            valid, stored_h, recalc_h = LogVerifier.verify_single_record(rec_dict)
            if not valid:
                return {
                    "valid": False,
                    "total_records": len(records),
                    "broken_index": idx,
                    "reason": f"Hash mismatch at index {idx}. Stored: {stored_h[:12]}..., Calculated: {recalc_h[:12]}..."
                }
            
            if rec_dict.get("previous_hash") != expected_prev_hash:
                return {
                    "valid": False,
                    "total_records": len(records),
                    "broken_index": idx,
                    "reason": f"Chain broken at index {idx}. Previous hash does not match preceding record's hash."
                }
                
            expected_prev_hash = stored_h

        return {
            "valid": True,
            "total_records": len(records),
            "broken_index": None,
            "reason": "All hashes and chain linkages verified successfully"
        }
