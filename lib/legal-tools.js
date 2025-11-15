/**
 * Legal Tools - GDPR, CCPA, and other privacy request generators
 */

/**
 * Generate GDPR data access request email
 */
export function generateGDPRAccessRequest(companyName, companyEmail, userInfo = {}) {
  const { name = 'User', email = '', address = '' } = userInfo;
  
  const subject = `GDPR Data Access Request - ${companyName}`;
  const body = `Dear ${companyName} Privacy Team,

I am writing to exercise my right under Article 15 of the General Data Protection Regulation (GDPR) to access my personal data.

Please provide me with:
1. A copy of all personal data you hold about me
2. Information about the purposes of processing
3. The categories of personal data concerned
4. The recipients or categories of recipients to whom the data has been disclosed
5. The retention period for my data
6. Information about my right to request rectification, erasure, or restriction of processing

My details:
- Name: ${name}
- Email: ${email}
${address ? `- Address: ${address}` : ''}

I look forward to your response within one month as required by GDPR.

Best regards,
${name}`;

  return { subject, body, to: companyEmail };
}

/**
 * Generate GDPR deletion request email
 */
export function generateGDPRDeletionRequest(companyName, companyEmail, userInfo = {}) {
  const { name = 'User', email = '', address = '' } = userInfo;
  
  const subject = `GDPR Data Deletion Request - ${companyName}`;
  const body = `Dear ${companyName} Privacy Team,

I am writing to exercise my right under Article 17 of the General Data Protection Regulation (GDPR) to request the deletion of my personal data.

Please delete all personal data you hold about me, unless you have a legal obligation to retain it.

My details:
- Name: ${name}
- Email: ${email}
${address ? `- Address: ${address}` : ''}

I understand that you may need to retain certain data for legal or regulatory purposes, but please delete all data that is not required to be retained.

I look forward to confirmation of deletion within one month as required by GDPR.

Best regards,
${name}`;

  return { subject, body, to: companyEmail };
}

/**
 * Generate CCPA opt-out request
 */
export function generateCCPAOptOut(companyName, companyEmail, userInfo = {}) {
  const { name = 'User', email = '' } = userInfo;
  
  const subject = `CCPA Opt-Out Request - Do Not Sell My Personal Information`;
  const body = `Dear ${companyName} Privacy Team,

I am writing to exercise my right under the California Consumer Privacy Act (CCPA) to opt-out of the sale of my personal information.

Please:
1. Stop selling my personal information to third parties
2. Confirm that you have processed this opt-out request
3. Provide information about how to verify my identity if required

My details:
- Name: ${name}
- Email: ${email}

I understand that you have 15 business days to process this request.

Best regards,
${name}`;

  return { subject, body, to: companyEmail };
}

/**
 * Generate account closure request
 */
export function generateAccountClosureRequest(companyName, companyEmail, userInfo = {}) {
  const { name = 'User', email = '', accountId = '' } = userInfo;
  
  const subject = `Account Closure Request - ${companyName}`;
  const body = `Dear ${companyName} Support Team,

I would like to close my account and request deletion of all associated personal data.

Account details:
- Email: ${email}
${accountId ? `- Account ID: ${accountId}` : ''}

Please:
1. Close my account immediately
2. Delete all personal data associated with my account
3. Confirm closure and data deletion in writing

If there are any outstanding obligations or subscriptions, please cancel them and provide a refund if applicable.

Best regards,
${name}`;

  return { subject, body, to: companyEmail };
}

/**
 * Generate complaint to data protection authority
 */
export function generateDPAComplaint(companyName, issue, userInfo = {}) {
  const { name = 'User', email = '', country = 'EU' } = userInfo;
  
  const template = `Complaint to Data Protection Authority

I wish to file a complaint against ${companyName} for the following issue:

${issue}

My details:
- Name: ${name}
- Email: ${email}
- Country: ${country}

I have attempted to resolve this issue directly with ${companyName} but have not received a satisfactory response.

Please investigate this matter and take appropriate action.

Best regards,
${name}`;

  return { template, authority: getDPAAuthority(country) };
}

/**
 * Get data protection authority for country
 */
function getDPAAuthority(country) {
  const authorities = {
    'EU': 'Your local Data Protection Authority',
    'UK': 'Information Commissioner\'s Office (ICO)',
    'US': 'Federal Trade Commission (FTC)',
    'CA': 'Office of the Privacy Commissioner of Canada',
  };
  return authorities[country] || 'Your local Data Protection Authority';
}

/**
 * Format request as email
 */
export function formatAsEmail(request) {
  return `To: ${request.to || 'privacy@company.com'}
Subject: ${request.subject}

${request.body}`;
}

/**
 * Copy to clipboard
 */
export async function copyRequestToClipboard(request) {
  const emailText = formatAsEmail(request);
  await navigator.clipboard.writeText(emailText);
  return true;
}

