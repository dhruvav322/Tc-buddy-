# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take the security of Privacy Guard seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
- **Email**: Create a new issue with title "SECURITY: [Brief Description]" and mark it as private if possible
- **GitHub Security**: Use GitHub's private security advisory feature
- **Repository Owner**: Contact the repository owner directly

### What to Include

When reporting a vulnerability, please include:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and severity
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Version**: Which version of the extension is affected
5. **Environment**: Browser version, OS, etc.
6. **Proof of Concept**: If applicable (please be responsible)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depending on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: Best effort

## Security Features

### Current Security Measures

1. **Encrypted API Key Storage**
   - API keys encrypted using AES-GCM
   - Web Crypto API for encryption
   - Keys never logged or exposed

2. **Content Security Policy**
   - Strict CSP for extension pages
   - No inline scripts allowed
   - No eval() or unsafe operations

3. **Permissions**
   - Minimal required permissions
   - Host permissions for functionality only
   - Declarative Net Request for blocking

4. **Rate Limiting**
   - 10 API requests per minute per provider
   - Prevents abuse and excessive costs
   - Automatic retry after window

5. **Cache Expiration**
   - Analysis cache expires after 24 hours
   - Prevents stale data
   - Automatic cleanup

6. **Input Sanitization**
   - All user inputs sanitized
   - No innerHTML with user data
   - XSS prevention

7. **Anti-Tampering**
   - Native DOM methods cached
   - Protected from website interference
   - Isolated content scripts

### Known Limitations

1. **Broad Host Permissions**: Required for analyzing any website
2. **Local Storage**: Data stored locally (not transmitted)
3. **API Keys**: User-managed, stored locally encrypted

## Privacy Commitment

- **No Data Collection**: We don't collect any user data
- **No Tracking**: No analytics or telemetry
- **No External Servers**: All processing local or via user's API keys
- **Open Source**: Code is auditable on GitHub

## Security Best Practices for Users

1. **API Keys**
   - Don't share your API keys
   - Use separate keys for this extension
   - Rotate keys periodically
   - Monitor API usage on provider dashboards

2. **Permissions**
   - Review extension permissions before installing
   - Only install from trusted sources
   - Check for updates regularly

3. **Updates**
   - Keep the extension updated
   - Security patches released promptly
   - Check changelog for security updates

4. **Configuration**
   - Use Local mode if privacy is paramount
   - AI mode sends text to external APIs
   - Review privacy settings

## Vulnerability Disclosure Policy

We follow a **coordinated disclosure** policy:

1. Reporter notifies us privately
2. We confirm and assess the vulnerability
3. We develop and test a fix
4. We release a patched version
5. We publicly disclose (with credit to reporter, if desired)
6. Typical disclosure timeline: 90 days

## Security Updates

Security updates are released as soon as possible:
- **Critical**: Immediate release
- **High**: Within 1 week
- **Medium**: Within 2 weeks
- **Low**: Next regular release

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

<!-- Security researchers who have helped improve Privacy Guard will be listed here -->

*No reports yet - be the first!*

## Contact

For security concerns, contact:
- **GitHub**: [@dhruvav322](https://github.com/dhruvav322)
- **Repository**: https://github.com/dhruvav322/Tc-buddy-/security/advisories/new

## Acknowledgments

We appreciate the security research community's efforts in keeping Privacy Guard secure.

---

**Last Updated**: 2024-11-15
**Version**: 2.0.0

