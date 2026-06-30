# Contributing to Website Rebuilder AI

Thank you for investing time in Website Rebuilder AI. Contributions are welcome
when they improve analysis, reconstruction quality, developer experience,
documentation, testing, or project safety.

By participating, you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md). For vulnerabilities, follow the private
reporting process in [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Before you start

- Search existing [issues](https://github.com/one1of1one/website-rebuilder-ai/issues)
  and pull requests before starting overlapping work.
- Use the appropriate
  [issue template](https://github.com/one1of1one/website-rebuilder-ai/issues/new/choose)
  for bugs, feature proposals, and questions.
- Open an issue before implementing a substantial feature, architecture change,
  new output target, or breaking API change.
- Only submit website content, fixtures, or assets you have the right to share.
- Keep pull requests focused. Unrelated refactors make review and rollback harder.

## Development setup

### Prerequisites

- Node.js 18 or newer
- npm
- Git

### Install and run

```bash
git clone https://github.com/one1of1one/website-rebuilder-ai.git
cd website-rebuilder-ai
npm install
npm start
```

The application is available at <http://localhost:3000> by default. For
file-watching development:

```bash
npm run dev
```

Use a different port when required:

```bash
PORT=4000 npm start
```

PowerShell:

```powershell
$env:PORT = "4000"
npm start
```

Never commit generated projects, downloaded third-party content, local
environment files, credentials, or `node_modules`.

## Branch strategy

`main` is the integration branch and should remain releasable. Create a short-lived
branch from the latest `main` for every contribution:

| Change | Branch pattern | Example |
| :--- | :--- | :--- |
| Feature | `feat/<description>` | `feat/vue-component-mapping` |
| Bug fix | `fix/<description>` | `fix/css-url-rewriting` |
| Documentation | `docs/<description>` | `docs/export-guide` |
| Tests | `test/<description>` | `test/crawler-limits` |
| Maintenance | `chore/<description>` | `chore/update-dependencies` |
| Security | Private advisory branch | Managed through GitHub Security Advisories |

Do not mix multiple concerns in one branch. Rebase or merge the latest `main`
before requesting final review, and resolve conflicts in your contribution branch.
Do not rewrite shared branch history without coordinating with collaborators.

## Commit message convention

Use concise [Conventional Commits](https://www.conventionalcommits.org/) style
messages:

```text
<type>(optional-scope): <imperative summary>
```

Common types:

- `feat`: user-visible capability
- `fix`: defect correction
- `docs`: documentation-only change
- `test`: test additions or corrections
- `refactor`: behavior-preserving code restructuring
- `perf`: performance improvement
- `build`: build or dependency change
- `ci`: automation change
- `chore`: repository maintenance

Examples:

```text
fix(crawler): preserve canonical URLs during normalization
test(generator): cover nested component output
docs(api): clarify rebuild mode compatibility
ci: add endpoint verification workflow
```

Keep the subject under 72 characters where practical. Explain motivation,
tradeoffs, and migration impact in the commit body when the summary is not enough.
Mark breaking changes with `!` and a `BREAKING CHANGE:` footer.

## Coding standards

Follow the repository's [coding standards](docs/12-coding-standards.md):

- Use CommonJS unless an approved migration changes the project-wide module system.
- Prefer small, focused modules and explicit data flow.
- Avoid hidden side effects and unnecessary runtime dependencies.
- Use safe path and URL helpers for any external or filesystem input.
- Preserve compatibility for public API fields, stored project records, and reports.
- Keep persistent storage separate from temporary generation workspaces.
- Route future AI providers through the provider abstraction.
- Comment non-obvious decisions, not self-explanatory syntax.

Match the style of surrounding code. Avoid repository-wide formatting changes in a
feature or bug-fix pull request.

## Testing requirements

Every behavior change requires proportionate tests. Add a fixture or regression test
that fails before the fix and passes afterward whenever possible.

Run the complete local test suite:

```bash
npm test
```

For changes affecting HTTP routes, storage, reports, exports, or end-to-end rebuilds,
start the application and run endpoint verification in another terminal:

```bash
npm start
npm run verify:endpoints
```

The endpoint verifier defaults to port `4000`, while the application defaults to
port `3000`. Set an explicit base URL when using the default application port:

```bash
BASE_URL=http://127.0.0.1:3000 npm run verify:endpoints
```

PowerShell:

```powershell
$env:BASE_URL = "http://127.0.0.1:3000"
npm run verify:endpoints
```

At minimum, pull requests must:

- Pass `npm test`.
- Pass endpoint verification when public API behavior is affected.
- Cover new analyzer and generator behavior with representative fixtures.
- Preserve existing report shapes, storage compatibility, and path-safety checks.
- Avoid network-dependent unit tests unless the test is explicitly an integration test.

See the [testing strategy](docs/11-testing-strategy.md) for regression priorities.

## Documentation requirements

Documentation is part of the implementation. Update it in the same pull request when
you change:

- Public endpoints, request fields, response fields, or errors.
- Supported output targets, export formats, rebuild modes, or options.
- Installation, runtime, testing, or deployment steps.
- Storage layout, architecture boundaries, or security assumptions.
- User-visible behavior, limitations, or compatibility guarantees.

Keep `README.md`, relevant files under `docs/`, `CHANGELOG.md`, and code examples
consistent with actual behavior. Do not claim that the project recovers private
server-side source or behavior that cannot be observed from a public response.

## Pull request process

1. Create or identify the issue your pull request will resolve.
2. Branch from the latest `main`.
3. Implement one focused change with tests and documentation.
4. Review your own diff for unrelated files, generated data, secrets, and debug output.
5. Run all applicable tests and record the commands in the pull request.
6. Complete every relevant item in the pull request template.
7. Link the issue with `Closes #<issue>` when the pull request fully resolves it.
8. Request review only after CI is green and the pull request is ready to merge.
9. Address review feedback with new commits; avoid force-pushing during active review
   unless the reviewer agrees.
10. Let maintainers choose the final merge strategy and release timing.

Maintainers may request changes when a contribution lacks tests, documentation,
backward compatibility, clear scope, or evidence that external content can be shared.

## Review criteria

Reviewers evaluate:

- Correctness and reproducibility
- Security and input handling
- Backward compatibility
- Test quality and regression coverage
- Maintainability and module boundaries
- Documentation accuracy
- Legal and responsible-use implications

Opening a pull request does not guarantee acceptance. Decisions prioritize the
project's architecture, safety, and long-term maintenance burden.
