-- Step 1: Create new enum types
CREATE TYPE "miniproject"."Role_new" AS ENUM ('CUSTOMER', 'ORGANIZER');
CREATE TYPE "miniproject"."TransactionStatus_new" AS ENUM (
  'WAITING_FOR_PAYMENT',
  'WAITING_FOR_ADMIN_CONFIRMATION',
  'DONE',
  'REJECTED',
  'EXPIRED',
  'CANCELED'
);

-- Step 2: Remove default constraint temporarily
ALTER TABLE "Transaction" 
ALTER COLUMN status DROP DEFAULT;

-- Step 3: Convert columns to use new types
ALTER TABLE "User" 
ALTER COLUMN role TYPE "miniproject"."Role_new" 
USING role::text::"miniproject"."Role_new";

ALTER TABLE "Transaction" 
ALTER COLUMN status TYPE "miniproject"."TransactionStatus_new" 
USING status::text::"miniproject"."TransactionStatus_new";

-- Step 4: Restore default with new enum value
ALTER TABLE "Transaction" 
ALTER COLUMN status SET DEFAULT 'WAITING_FOR_PAYMENT'::"miniproject"."TransactionStatus_new";

-- Step 5: Clean up old types
DROP TYPE "miniproject"."Role";
DROP TYPE "miniproject"."TransactionStatus";

-- Step 6: Rename new types
ALTER TYPE "miniproject"."Role_new" RENAME TO "Role";
ALTER TYPE "miniproject"."TransactionStatus_new" RENAME TO "TransactionStatus";