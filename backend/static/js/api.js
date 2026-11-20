/**
 * Atheria Reserve Bank - High-Performance API Service Layer
 * - Same-Origin Relative API Routing (Eliminates Cross-Origin CORS Preflight Penalties on Vercel & Render)
 * - In-Flight Request Deduplication for Concurrent GET Queries
 * - Automatic Double-Submission Guard with Instant Button Feedback
 * - Microsecond Debounce Utility for Live Search & Calculations
 */

const BACKEND_BASE_URL = "https://banking-system-1-0ae4.onrender.com";

// Auto-determine base API URL:
// - If running on Render or Vercel (or localhost), use relative path ('') to keep requests SAME-ORIGIN.
//   This avoids CORS OPTIONS preflight overhead (~300-600ms latency savings per call)
// - If running in standalone decoupled external client, route to live Render URL.
const isSameOriginHost = (typeof window !== 'undefined' && window.location && window.location.origin)
  ? (window.location.origin.includes('onrender.com') ||
     window.location.origin.includes('vercel.app') ||
     window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')
  : false;

const API_BASE_URL = isSameOriginHost ? '' : BACKEND_BASE_URL;

// Cache map for deduplicating in-flight GET requests
const inFlightRequests = new Map();

function getCookie(name) {
  let cookieValue = null;
  if (typeof document !== 'undefined' && document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * Universal API Request with in-flight deduplication and graceful error handling.
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  const fullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Deduplicate concurrent identical GET requests
  if (method === 'GET' && inFlightRequests.has(fullUrl)) {
    return inFlightRequests.get(fullUrl);
  }

  const token = getCookie('csrftoken') || '';
  const options = {
    method,
    headers: {
      'X-CSRFToken': token,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(fullUrl, options);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || 'An unexpected error occurred.');
      }
      return json;
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message, 'error');
      }
      throw err;
    } finally {
      if (method === 'GET') {
        inFlightRequests.delete(fullUrl);
      }
    }
  })();

  if (method === 'GET') {
    inFlightRequests.set(fullUrl, fetchPromise);
  }

  return fetchPromise;
}

/**
 * High-performance debounce utility for live search and input filters.
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Instant double-submission protection and loading feedback for all banking forms.
 */
function setupDoubleSubmitProtection() {
  if (typeof document === 'undefined') return;

  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form || form.tagName !== 'FORM') return;

    if (form.dataset.submitting === 'true') {
      e.preventDefault();
      return false;
    }

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn && !submitBtn.disabled) {
      form.dataset.submitting = 'true';
      submitBtn.dataset.originalContent = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.75';
      submitBtn.style.cursor = 'wait';

      // Safety reset after 10s if the page doesn't reload or network times out
      setTimeout(() => {
        form.dataset.submitting = 'false';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
        submitBtn.style.cursor = '';
      }, 10000);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDoubleSubmitProtection);
  } else {
    setupDoubleSubmitProtection();
  }
}

// Banking Endpoints Service Definition
const BankingAPI = {
  deposit: (accNo, amount, desc) => apiRequest('/api/deposit/', 'POST', { account_number: accNo, amount, description: desc }),
  withdraw: (accNo, amount, desc) => apiRequest('/api/withdraw/', 'POST', { account_number: accNo, amount, description: desc }),
  transfer: (fromAcc, toAcc, amount, desc) => apiRequest('/api/transfer/', 'POST', { from_account: fromAcc, to_account: toAcc, amount, description: desc }),
  getBalance: (accNo) => apiRequest(`/api/balance/${accNo}/`),
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/transactions/?${query}`);
  },
  calculateEMI: (p, r, n) => apiRequest(`/api/loan/emi/?p=${p}&r=${r}&n=${n}`),
  applyLoan: (accNo, loanType, principal, tenure) => apiRequest('/api/loan/apply/', 'POST', {
    account_number: accNo,
    loan_type: loanType,
    principal,
    tenure_months: tenure
  }),
  adminLoanDecision: (loanId, decision) => apiRequest(`/api/admin/loan/${loanId}/decision/`, 'POST', { decision }),
  adminAccountStatus: (accountId, status) => apiRequest(`/api/admin/account/${accountId}/status/`, 'POST', { status }),
  checkHealth: () => apiRequest('/health/'),
};

// Export to window/global scope
if (typeof window !== 'undefined') {
  window.BankingAPI = BankingAPI;
  window.debounce = debounce;
  window.apiRequest = apiRequest;
}
