# Checklist for Safe Object Updates in Angular/TypeScript

Use this checklist whenever you update nested objects (e.g., photoInfo inside UserPhoto) to avoid accidental data loss, overwrites, or race conditions.

## 1. Treat shared state as immutable

- Never mutate objects that are:
  - Held in services (BehaviorSubject, Redux‑like stores),
  - Passed into/out of modals, dialogs, or HTTP callbacks,
  - Used as inputs to *Subject.next() / state updates.
- Always create new objects instead of changing existing ones in place.

```ts
// ❌ Bad
photo.photoInfo.title = 'New title';

// ✅ Good
photo = {
  ...photo,
  photoInfo: {
    ...photo.photoInfo,
    title: 'New title',
  },
};
```

## 2. Use Partial<T> for updates

- Type update payloads as Partial<T> to make it clear they are partial.
- Do not assume all fields are present in the update object.

```ts
updatePhotoInfo(photo: UserPhoto, photoInfo: Partial<PhotoInfo>): Promise<UserPhoto>
```

## 3. Always merge, never replace, unless intentional

- When updating nested objects, explicitly merge with existing data.

```ts
// ❌ Bad – overwrites everything
photo.photoInfo = { title, description };

// ✅ Good – preserves other fields (e.g., extractedText)
photo.photoInfo = {
  ...photo.photoInfo,
  title,
  description,
};
```

- In service methods, do:

```ts
const existingInfo = photo.photoInfo ?? {};

const updatedPhoto: UserPhoto = {
  ...photo,
  photoInfo: {
    ...existingInfo,
    ...photoInfo, // partial update
  },
};
```

## 4. Avoid undefined overwriting existing values

- Do not pass properties set to undefined in update objects.
- If you build update objects dynamically, only include defined fields.

```ts
const updates: Partial<PhotoInfo> = {};

if (title !== undefined) {
  updates.title = title;
}
if (description !== undefined) {
  updates.description = description;
}

// Then pass `updates` to your update function
```

- Or use a helper:

```ts
function filterDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  }
  return result;
}

await updatePhotoInfo(photo, filterDefined({ title, description, extractedText }));
```

## 5. Be careful with spread order

- Remember: later properties override earlier ones.

```ts
{
  ...oldObject,
  ...updates,       // overrides oldObject
  extraField: 42,   // always set
}
```

- If you want to preserve old values, put them first and only override what you intend.

## 6. Handle optional / missing nested objects

- Guard against undefined nested objects before spreading.

```ts
const existingInfo = photo.photoInfo ?? {};

photoInfo: {
  ...existingInfo,
  ...updates,
}
```

- Initialize nested objects at creation time if possible.

## 7. Avoid direct mutations in callbacks and subscriptions

- In subscribe, onWillDismiss, then/catch, etc., never mutate the original object.

```ts
// ❌ Bad inside subscription
photos$.subscribe(photos => {
  photos[0].photoInfo.title = 'Changed';
});

// ✅ Good
photos$.subscribe(photos => {
  const updated = photos.map((p, i) =>
    i === 0
      ? { ...p, photoInfo: { ...p.photoInfo, title: 'Changed' } }
      : p
  );
});
```

## 8. Return new instances from service methods

- Service methods that update state should return new objects/arrays.
- Update your subject/store with the new instance, not the mutated old one.

```ts
this.photos = this.photos.map(p =>
  p.filepath === updatedPhoto.filepath ? updatedPhoto : p
);
    this.photosSubject.next(this.photos); // new array reference
```

## 9. Be explicit about what changes

- When constructing update objects, only include fields you truly want to change.
- Avoid patterns like:

```ts
// Risky if some fields might be undefined
const photoInfo = { title, description, extractedText };
```

### Prefer:

```ts
const photoInfo: Partial<PhotoInfo> = {};
if (title !== undefined) photoInfo.title = title;
if (description !== undefined) photoInfo.description = description;
if (extractedText !== undefined) photoInfo.extractedText = extractedText;
```

## 10. Log strategically when debugging

- Log before and after each update:

```ts
console.log('updatePhotoInfo – before:', photo.photoInfo);
console.log('updatePhotoInfo – updates:', photoInfo);
console.log('updatePhotoInfo – after:', updatedPhoto.photoInfo);
```

- Log at key boundaries:
  - Before opening modals,
  - After modal returns (onWillDismiss),
  - After service updates.

This helps you see exactly where a field disappears or changes.

## 11. Watch out for “fixed by logging” bugs

If adding/removing console.log changes behavior, suspect:

- Race conditions,
- Timing‑dependent code,
- Mutations combined with async updates.

In such cases:

- Enforce immutable updates (this checklist),
- Reduce shared mutable state,
- Make data flow more explicit (single source of truth, clear update paths).
