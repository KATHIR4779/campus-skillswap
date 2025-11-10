// Allowed university email domains for registration
const allowedDomains = [
  'hicet.ac.in',
  'annauniv.edu',
  'psgtech.edu',
  'cit.edu',
  'kct.ac.in',
  'sastra.edu',
  'vit.ac.in',
  'srmist.edu.in',
  'amrita.edu',
  'veltech.edu.in',
  'university.edu',
  'college.edu',
  'institute.edu',
  'ac.in',
  'edu.in',
  'edu'
];

/**
 * Validates if an email belongs to an allowed university domain
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if email domain is allowed, false otherwise
 */
const validateUniversityEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }
  
  return allowedDomains.some(allowedDomain => 
    domain === allowedDomain || domain.endsWith('.' + allowedDomain)
  );
};

/**
 * Gets the list of allowed domains
 * @returns {string[]} - Array of allowed email domains
 */
const getAllowedDomains = () => {
  return [...allowedDomains];
};

/**
 * Adds a new domain to the allowed list
 * @param {string} domain - The domain to add
 * @returns {boolean} - True if added successfully, false if already exists
 */
const addAllowedDomain = (domain) => {
  const normalizedDomain = domain.toLowerCase().trim();
  if (!allowedDomains.includes(normalizedDomain)) {
    allowedDomains.push(normalizedDomain);
    return true;
  }
  return false;
};

/**
 * Removes a domain from the allowed list
 * @param {string} domain - The domain to remove
 * @returns {boolean} - True if removed successfully, false if not found
 */
const removeAllowedDomain = (domain) => {
  const normalizedDomain = domain.toLowerCase().trim();
  const index = allowedDomains.indexOf(normalizedDomain);
  if (index > -1) {
    allowedDomains.splice(index, 1);
    return true;
  }
  return false;
};

module.exports = {
  validateUniversityEmail,
  getAllowedDomains,
  addAllowedDomain,
  removeAllowedDomain,
  allowedDomains
};

