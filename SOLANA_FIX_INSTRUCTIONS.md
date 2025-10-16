# Solana Contract Fix Instructions

## Problem
The `ApproveRelease` function fails with "Failed to serialize or deserialize account data" because:
1. The escrow account is allocated with MAX_SIZE (498 bytes)
2. Only ~174 bytes contain actual Borsh-serialized data
3. The rest is zero-padding
4. Borsh's `try_from_slice()` expects exact data, not padded data

## Solution
Change how we deserialize the escrow data to handle the padded account properly.

## File to Edit
`solanascrow/src/processor.rs`

### Change 1: In `process_approve_release` function (around line 214)

**FIND:**
```rust
        let data = escrow_account.try_borrow_data()?;
        let mut escrow = match Escrow::try_from_slice(&data) {
            Ok(e) => {
                msg!("Successfully deserialized escrow");
                e
            },
            Err(e) => {
                msg!("Deserialization error: {:?}", e);
                return Err(e.into());
            }
        };
```

**REPLACE WITH:**
```rust
        use std::io::Cursor;
        
        let data = escrow_account.try_borrow_data()?;
        let mut cursor = Cursor::new(&data[..]);
        let mut escrow = Escrow::deserialize(&mut cursor)?;
```

### Change 2: In `process_cancel_escrow` function (around line 289)

**FIND:**
```rust
        let mut escrow = Escrow::try_from_slice(&escrow_account.data.borrow())?;
```

**REPLACE WITH:**
```rust
        use std::io::Cursor;
        
        let data = escrow_account.try_borrow_data()?;
        let mut cursor = Cursor::new(&data[..]);
        let mut escrow = Escrow::deserialize(&mut cursor)?;
```

## Build and Deploy

After making these changes:

```bash
cd solanascrow
cargo build-sbf
node upgrade-program.js "embody sand file spoon fame test unit soccer blur fitness pulp narrow"
```

Then test again with:
```bash
node test-approve-escrow.cjs "embody sand file spoon fame test unit soccer blur fitness pulp narrow"
```
