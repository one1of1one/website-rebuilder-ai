# Security Policy

Website Rebuilder AI accepts untrusted URLs, parses remote content, downloads assets,
writes project files, and creates archives. Security reports involving these trust
boundaries are treated seriously.

## Supported versions

Security fixes are developed for the current release line.

| Version | Supported |
| :--- | :---: |
| `2.x` | ✅ |
| `< 2.0` | ❌ |
| Unreleased `main` | Best effort |

Users should reproduce a finding against the latest release or current `main` before
reporting it. Older versions may be evaluated when the same issue affects a supported
version, but they will not normally receive separate patches.

## Reporting a vulnerability

**Do not report vulnerabilities in a public issue, discussion, pull request, or
social-media post.**

Use GitHub's private vulnerability reporting:

1. Open the repository's
   [Security Advisories](https://github.com/one1of1one/website-rebuilder-ai/security/advisories).
2. Select **Report a vulnerability**.
3. Submit the report privately with enough detail to reproduce and assess it.

If private vulnerability reporting is unavailable, open a
[minimal public issue](https://github.com/one1of1one/website-rebuilder-ai/issues/new)
requesting a private security contact. Do not include vulnerability details,
proof-of-concept code, affected URLs, secrets, or exploit output in that issue.

A useful private report includes:

- A concise vulnerability type and impact statement.
- Affected versions, modules, routes, and configuration.
- Reproduction steps or a minimal proof of concept.
- Required privileges and realistic attack conditions.
- Relevant logs or screenshots with sensitive data removed.
- Suggested remediation, if known.
- Whether the issue has been disclosed anywhere else.

Do not test against websites, accounts, or infrastructure you do not own or have
explicit permission to assess. Do not access, modify, retain, or publish other
people's data.

## Response process

Maintainers aim to:

- Acknowledge a complete report within seven days.
- Confirm whether the issue is reproducible and in scope.
- Keep the reporter informed when remediation status materially changes.
- Coordinate a disclosure date after a fix or mitigation is available.
- Credit the reporter when requested and appropriate.

Response time depends on severity, reproducibility, maintainer availability, and the
complexity of a safe backward-compatible fix. These targets are goals, not a
service-level agreement.

## Responsible disclosure

Reporters are expected to:

1. Give maintainers a reasonable opportunity to investigate and remediate.
2. Keep technical details private until a coordinated disclosure date is agreed.
3. Avoid destructive testing, persistence, lateral movement, and data exfiltration.
4. Use the minimum data and requests needed to demonstrate impact.
5. Delete any sensitive data obtained unintentionally and report the exposure.
6. Avoid demanding payment, threatening disclosure, or misrepresenting impact.

Maintainers will validate the issue, assess severity, prepare a fix or mitigation,
test for regressions, and publish an advisory when appropriate. A report may be closed
when it is not reproducible, affects no supported version, describes intended
behavior, or lacks a meaningful security impact.

## Scope

Examples of relevant reports include:

- Server-side request forgery or network-boundary bypass.
- Path traversal or writes outside intended project and storage directories.
- Malicious archive content or unsafe extraction behavior.
- Remote code execution, command injection, or unsafe process invocation.
- Cross-site scripting or injection in the local dashboard.
- Authorization or data-isolation failures in a deployed instance.
- Sensitive information written to reports, logs, exports, or generated projects.
- Dependency vulnerabilities that are exploitable in the project's runtime.

Generally out of scope:

- Missing features or ordinary functional bugs without security impact.
- Vulnerabilities that require a deliberately insecure unsupported deployment.
- Social engineering, denial-of-service load testing, or physical attacks.
- Findings produced only by automated scanners without evidence of exploitability.
- Security issues in a target website that Website Rebuilder AI merely analyzes.
- Reports against unsupported versions that do not affect a supported release.

## Security best practices

### For operators

- Run the service on a trusted network unless you add authentication and isolation.
- Do not expose the development server directly to the public internet.
- Run with a non-administrator account and least-privilege filesystem permissions.
- Treat generated projects, downloaded assets, reports, and ZIP files as untrusted.
- Review output before executing generated code or deploying it.
- Keep Node.js and npm dependencies on supported, patched versions.
- Restrict outbound network access when processing untrusted URLs.
- Keep secrets out of environment files, logs, project content, and exported archives.
- Delete stored projects and reports according to your data-retention requirements.

### For contributors

- Validate protocols, hosts, paths, identifiers, filenames, and archive entries.
- Preserve crawl limits, request timeouts, response-size limits, and redirect checks.
- Never concatenate untrusted input into shell commands.
- Resolve filesystem paths against an explicit trusted root and verify containment.
- Avoid logging full remote responses, credentials, tokens, or personal information.
- Add regression tests for every security fix.
- Keep vulnerability patches private until coordinated disclosure.

This policy covers the Website Rebuilder AI repository. It does not authorize testing
of third-party websites or services.
