# BorrowMutError Fix Instructions

## Problem
The `process_create_escrow` function panics with `BorrowMutError` because we're trying to borrow the counter account data both immutably and mutably.

## File to Edit
`solanascrow/src/processor.rs`

## Fix
In the `process_create_escrow` function, around line 135-138:

**FIND:**
```rust
        // Load and increment counter
        let mut counter = EscrowCounter::try_from_slice(&counter_account.data.borrow())?;
        counter.count = counter.count.checked_add(1).ok_or(EscrowError::AmountOverflow)?;
        let escrow_id = counter.count;
        counter.serialize(&mut &mut counter_account.data.borrow_mut()[..])?;
```

**REPLACE WITH:**
```rust
        // Load and increment counter
        {
            let mut counter_data = counter_account.data.borrow_mut();
            let mut counter = EscrowCounter::try_from_slice(&counter_data)?;
            counter.count = counter.count.checked_add(1).ok_or(EscrowError::AmountOverflow)?;
            let escrow_id = counter.count;
            counter.serialize(&mut &mut counter_data[..])?;
        }
        // Now we need to get the escrow_id again since it's out of scope
        let counter_data = counter_account.data.borrow();
        let counter = EscrowCounter::try_from_slice(&counter_data)?;
        let escrow_id = counter.count;
```

Wait, that's getting complex. Here's a simpler fix:

**REPLACE WITH:**
```rust
        // Load and increment counter
        let mut counter_data = counter_account.data.borrow_mut();
        let mut counter = EscrowCounter::try_from_slice(&counter_data)?;
        counter.count = counter.count.checked_add(1).ok_or(EscrowError::AmountOverflow)?;
        let escrow_id = counter.count;
        counter.serialize(&mut &mut counter_data[..])?;
        drop(counter_data); // Explicitly drop the borrow
```

Actually, the simplest fix is to restructure it:

**REPLACE WITH:**
```rust
        // Load and increment counter
        let mut counter_data = counter_account.data.borrow_mut();
        let mut counter = EscrowCounter::try_from_slice(&counter_data)?;
        let escrow_id = counter.count.checked_add(1).ok_or(EscrowError::AmountOverflow)?;
        counter.count = escrow_id;
        counter.serialize(&mut &mut counter_data[..])?;
        drop(counter_data);
```

## Build and Deploy

After making this change:

```bash
cd solanascrow
cargo build-sbf
node upgrade-program.js "embody sand file spoon fame test unit soccer blur fitness pulp narrow"
node initialize-counter.js "embody sand file spoon fame test unit soccer blur fitness pulp narrow"
```
