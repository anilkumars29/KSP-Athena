const API_BASE = '/server/ks_intelli_pol_function';

export const apiUrl = (path: string) => `${API_BASE}${path}`;

export const authFetch = async (path: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('ksp_auth_token');
    const headers = new Headers(init.headers);

    if (token) {
        headers.set('X-Athena-Token', token);
    }

    const response = await fetch(apiUrl(path), { ...init, headers });

    if (response.status === 401) {
        localStorage.removeItem('ksp_auth_token');
        localStorage.removeItem('ksp_role');
        localStorage.removeItem('ksp_username');
        window.location.assign(`${import.meta.env.BASE_URL}#/login`);
    }

    return response;
};
