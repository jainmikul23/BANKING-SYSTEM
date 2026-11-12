/**
 * API Service layer for banking AJAX operations
 */

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

const csrfToken = getCookie('csrftoken');

async function apiRequest(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok || !json.ok) {
      throw new Error(json.message || 'An unexpected error occurred.');
    }
    return json;
  } catch (err) {
    showToast(err.message, 'error');
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

