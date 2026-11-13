---
"micro": patch
---

`buffer()` always resolves with a `Buffer`, even when the request's `Content-Type` has a `charset`. `text()` and `json()` still decode the body with that charset.
