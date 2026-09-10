# Testing the Firestore security rules

The rules in `firestore.rules` are the real enforcement for the parent link. They need the Firestore emulator, which needs Java 21+. The build machine used for this project had no Java, so these tests are written but were not executed there.

## Run

```bash
# once
winget install Microsoft.OpenJDK.21   # or any JDK 21+

npm run test:rules
```

`test:rules` starts the emulator, runs `rules-tests/rules.test.ts` against it, and shuts it down.

## What the tests assert

- A teacher can create, read, update and delete their own students and nothing of anyone else's.
- Anyone (no auth) can `get` a student by id, but cannot `list` students.
- A parent (no auth) can change only `log`, `parentNote` and `updatedAt`; changing the slip, name or teacherId is rejected.
- A parent note over 500 characters is rejected.
- A teacher cannot change their own `plan`, `planUntil` or `trialEndsAt`; the admin email can.
- Events can be created with an allowed type only; feedback text must be 1–2000 characters.
