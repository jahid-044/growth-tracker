# Signup Form — Learner Guide

The signup form lives in `packages/client/src/pages/Signup.tsx`. It is your primary implementation exercise. It covers a range of real-world form patterns that you will encounter repeatedly in production apps. The backend is already built — your job is to implement the UI that collects and submits the data.

Use the Swagger UI at **http://localhost:8000/api/docs** to explore the API contract: what fields are required, what values are valid, and what the server returns.

---

## Testing your implementation

A test suite in `packages/client/src/__tests__/Signup.test.tsx` verifies that your form works correctly. Run it with:

```bash
pnpm --filter dsissue-react test
```

The tests use `data-testid` attributes to find elements. You **must** add these attributes to the matching elements — without them the tests cannot find your components. Every required attribute is listed in the section it belongs to below.

---

## 1. Email and Password — Basic Controlled Inputs

**Fields:** `email`, `password`

The foundation of every React form. A controlled input means the input's value is always driven by React state — the component, not the browser, owns the truth.

**Required `data-testid` attributes:**

| Attribute | Element |
|---|---|
| `email-input` | `<input type="email">` |
| `password-input` | `<input type="password">` |

**What to explore:**
- The difference between controlled (`value` + `onChange`) and uncontrolled (`ref`) inputs, and when you'd choose each
- How `type="email"` and `type="password"` give you browser-level behaviour for free
- The `autoComplete` attribute and why it matters for password managers and accessibility

---

## 2. Password Validation Rules — Real-Time Derived State

**Field:** derived from `password`

Show a checklist of three rules below the password field. Each rule updates live as the user types — it is either met or unmet. The checked/unchecked state is **not stored in state** — it is computed from the password value on every render.

**Rules to implement:**

| Rule | Met when… |
|---|---|
| At least 8 characters | `password.length >= 8` |
| At least one capital letter | `/[A-Z]/.test(password)` |
| At least one special character | `/[^A-Za-z0-9]/.test(password)` |

**Required `data-testid` attributes:**

Each rule element must also carry a `data-met` attribute set to `"true"` or `"false"`:

```html
<li data-testid="password-rule-length" data-met="false">At least 8 characters</li>
<li data-testid="password-rule-upper"  data-met="false">At least one capital letter</li>
<li data-testid="password-rule-special" data-met="false">At least one special character</li>
```

When the rule is satisfied, flip the attribute to `data-met="true"` and apply a visual style (e.g. green text + tick icon).

**What to explore:**
- The distinction between state and values derived from state — and why storing derived values in state creates bugs
- How to reflect real-time feedback without adding extra event handlers
- Separating the rule-checking logic from the JSX so it can be reasoned about and tested in isolation

---

## 3. Role Selector — Radio Buttons as a Styled Toggle

**Field:** `role` (`LEARNER` | `MANAGER`)

Two mutually exclusive options styled as a toggle — not the default browser radio appearance.

**Required `data-testid` attributes:**

| Attribute | Element |
|---|---|
| `role-learner` | `<input type="radio">` for LEARNER |
| `role-manager` | `<input type="radio">` for MANAGER |

Place these on the `<input>` element itself, even if it is visually hidden inside a `<label>`.

**What to explore:**
- Why wrapping an input in a `<label>` makes the entire area clickable without any JavaScript
- The `sr-only` pattern — visually hiding the native input while keeping it present for screen readers and keyboard navigation
- Managing a single string state value for a group of mutually exclusive options

---

## 4. Conditional Show/Hide — Team Name

**Field:** `teamName` (visible only when `role` is `MANAGER`)

This is the most important pattern in the form. Real forms constantly show or hide fields based on earlier answers.

**Required `data-testid` attributes:**

| Attribute | Element |
|---|---|
| `team-name-input` | `<input>` for team name — **only rendered when role is MANAGER** |

**What to explore:**
- The difference between conditionally rendering a field (unmounting it from the DOM) vs hiding it with CSS — they behave differently when it comes to preserving state
- Why state for a hidden field should be **cleared** when the field disappears, so it does not get submitted with stale data
- How the backend enforces the same rule independently — the frontend condition is a UX guard, not the only safeguard

---

## 5. Department — Select / Dropdown

**Field:** `department`

A fixed list of options the user picks from.

**Valid values:** `Engineering`, `Product`, `Design`, `Marketing`, `Operations`, `HR`, `Other`

**Required `data-testid` attributes:**

| Attribute | Element |
|---|---|
| `department-select` | `<select>` |

**What to explore:**
- How to show a "please select" prompt that is not itself a valid choice (`value=""` + `disabled`)
- Why the list of options should live in a constant outside the component rather than inline in the JSX
- The trade-off between a native `<select>` (simple, accessible, hard to style) and a custom-built dropdown (full control, more code, accessibility is your responsibility)

---

## 6. Experience Level — Radio Group

**Field:** `experienceLevel` (`JUNIOR` | `MID` | `SENIOR`)

A radio group where each option has a label and a short description below it.

**Required `data-testid` attributes:**

| Attribute | Element |
|---|---|
| `experience-junior` | `<input type="radio">` for JUNIOR |
| `experience-mid` | `<input type="radio">` for MID |
| `experience-senior` | `<input type="radio">` for SENIOR |

**What to explore:**
- Rendering a list of options from a data array rather than copy-pasting JSX for each one
- How the `name` attribute groups radio inputs so the browser enforces single-selection without any JavaScript
- Associating descriptive sub-text with a radio option in a way that is still accessible

---

## 7. Address Groups — Dynamic List

**Fields:** `addresses[]` — each entry has `label`, `street1`, `street2` (optional), `city`, `state`, `zipCode`, `country`

Users can add zero or more addresses. Each address is an object inside a state array.

**Required `data-testid` attributes:**

| Attribute | Element |
|---|---|
| `add-address-btn` | The "Add an address" button |
| `address-group` | The wrapper element for **each** address group |
| `remove-address-btn` | The remove button **inside** each address group |
| `address-label-input` | The label `<input>` **inside** each address group |
| `address-street1-input` | The street1 `<input>` **inside** each address group |
| `address-city-input` | The city `<input>` **inside** each address group |
| `address-state-input` | The state `<input>` **inside** each address group |
| `address-zip-input` | The ZIP `<input>` **inside** each address group |
| `address-country-input` | The country `<input>` **inside** each address group |

The attributes on inputs inside a group do **not** need to be globally unique — the tests use `within(group)` to scope lookups to a specific group.

**What to explore:**
- Why you must never mutate state arrays directly, and how to add, remove, and update items immutably
- Using a client-generated ID (e.g. `crypto.randomUUID()`) as the React `key` for each item — why the array index is a poor choice when items can be removed or reordered
- Stripping client-only fields (`id`, `isOpen`) before sending the data to the API

---

## 8. Collapsible Address Groups — Expand / Collapse

**Interaction:** each address group can be independently collapsed and expanded via a header toggle

**What to explore:**
- Where to store the open/closed state: per-item inside the array, or separately — and why co-locating it with the item data is often cleaner
- `display: none` (via a `hidden` class) vs unmounting — `hidden` keeps the DOM node and preserves input values; unmounting discards them. Which is right here?
- Reflecting open/closed state in an icon (e.g. rotating a chevron) as a CSS-only micro-interaction driven by a class

---

## Submitting the Form

**Required `data-testid` attributes:**

| Attribute | Element |
|---|---|
| `submit-btn` | The submit `<button>` |
| `error-message` | The element that shows API error text |

When the user submits:

1. Prevent the default browser form submission with `e.preventDefault()`
2. Sanitise the payload — strip client-only fields (`id`, `isOpen`) from addresses; omit `teamName` entirely when role is `LEARNER`
3. `POST` to `http://localhost:8000/api/auth/signup` with `Content-Type: application/json` and `credentials: 'include'` so the refresh token cookie set by the server is accepted by the browser
4. Handle success: store `accessToken` in `localStorage`, then call `navigate('/')`
5. Handle errors: display the `message` field from the API response in the `error-message` element

Check **http://localhost:8000/api/docs** for the exact shape of the request body and the possible error responses before you start wiring up the fetch call.
