use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}

/// Unique identifier for an escrow
pub type EscrowId =
  Int

/// Address type (PubKeyHash)
pub type Address =
  VerificationKeyHash

/// Escrow datum containing all escrow state
pub type EscrowDatum {
  escrow_id: EscrowId,
  creator: Address,
  beneficiary: Address,
  amount_lovelace: Int,
  approver1: Address,
  approver2: Address,
  approver3: Option<Address>,
  description: ByteArray,
  approvals: List<Address>,
  is_completed: Bool,
  created_at: Int,
  completed_at: Option<Int>,
}

/// Redeemer actions for the escrow validator
pub type EscrowRedeemer {
  /// Approve the release of funds
  ApproveRelease { escrow_id: EscrowId }
  /// Cancel the escrow (creator only, no approvals yet)
  CancelEscrow { escrow_id: EscrowId }
}

/// Helper function to check if an address is an approver
pub fn is_approver(addr: Address, datum: EscrowDatum) -> Bool {
  addr == datum.approver1 || addr == datum.approver2 || when datum.approver3 is {
    Some(a3) -> addr == a3
    None -> False
  }
}

/// Helper function to check if an address has already approved
pub fn has_approved(addr: Address, datum: EscrowDatum) -> Bool {
  list.any(datum.approvals, fn(a) { a == addr })
}

/// Get list of unique approvers
pub fn get_unique_approvers(datum: EscrowDatum) -> List<Address> {
  let base_approvers =
    [datum.approver1, datum.approver2]
  let all_approvers =
    when datum.approver3 is {
      Some(a3) -> list.concat(base_approvers, [a3])
      None -> base_approvers
    }
  list.unique(all_approvers)
}

/// Calculate required number of approvals
pub fn required_approvals(datum: EscrowDatum) -> Int {
  let unique_count = list.length(get_unique_approvers(datum))
  when unique_count is {
    0 -> 0
    1 -> 1
    2 -> 2
    _ -> 2
  }
}

/// Check if escrow can be released
pub fn can_be_released(datum: EscrowDatum) -> Bool {
  !datum.is_completed && list.length(datum.approvals) >= required_approvals(
    datum,
  )
}

