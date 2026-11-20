/**
 * API Service layer for banking AJAX operations
 * Live Backend: https://banking-system-1-0ae4.onrender.com
 */

const BACKEND_BASE_URL = "https://banking-system-1-0ae4.onrender.com";

// Auto-determine base API URL:
// - If already on Render live host, use relative paths ('')
// - If running on a local or external frontend, route all calls to the live Render backend
const API_BASE_URL = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.includes('banking-system-1-0ae4.onrender.com'))
  ? ''
  : BACKEND_BASE_URL;

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
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

async function apiRequest(endpoint, method = 'GET', data = null) {
  const fullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

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
  }
}

// Banking Endpoints
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
};
