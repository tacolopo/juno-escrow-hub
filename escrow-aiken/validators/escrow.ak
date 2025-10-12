use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use escrow/types.{
  ApproveRelease, CancelEscrow, EscrowDatum, EscrowRedeemer, can_be_released,
  has_approved, is_approver,
}

// Context types for Plutus V2
pub type ScriptContext {
  transaction: Transaction,
  redeemer: Data,
  info: ScriptInfo,
}

pub type ScriptInfo {
  purpose: ScriptPurpose,
}

pub type ScriptPurpose {
  Spending(ByteArray)
}

pub type Transaction {
  inputs: List<Input>,
  outputs: List<Output>,
  extra_signatories: List<VerificationKeyHash>,
}

pub type Input {
  output_reference: ByteArray,
}

pub type Output {
  address: ByteArray,
  value: Int,
  datum: Option<Data>,
}

/// Main escrow validator - simplified for compilation
validator escrow_validator {
  spend(
    datum_opt: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    _own_ref: Data,
    ctx: ScriptContext,
  ) {
    expect Some(datum) = datum_opt
    
    let signatories = ctx.transaction.extra_signatories
    
    when redeemer is {
      ApproveRelease { escrow_id } -> {
        // Verify escrow ID matches
        let correct_escrow = datum.escrow_id == escrow_id
        
        // Check not completed
        let not_completed = !datum.is_completed
        
        // Check signer is valid approver who hasn't approved yet
        let valid_approver =
          list.any(
            signatories,
            fn(sig) { is_approver(sig, datum) && !has_approved(sig, datum) },
          )
        
        correct_escrow && not_completed && valid_approver
      }
      
      CancelEscrow { escrow_id } -> {
        // Verify escrow ID matches
        let correct_escrow = datum.escrow_id == escrow_id
        
        // Check not completed
        let not_completed = !datum.is_completed
        
        // Check creator signed
        let creator_signed = list.has(signatories, datum.creator)
        
        // Check no approvals yet
        let no_approvals = list.is_empty(datum.approvals)
        
        correct_escrow && not_completed && creator_signed && no_approvals
      }
    }
  }

  else(_) {
    fail
  }
}
