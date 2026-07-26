export const getHashPath = () => {
    const path = window.location.hash.replace(/^#/, '');
    return path.startsWith('/') ? path : '/dashboard';
};

export const hashHref = (path: string) => `#${path}`;

export const navigateTo = (path: string) => {
    const nextHash = hashHref(path);

    if (window.location.hash === nextHash) {
        window.dispatchEvent(new Event('hashchange'));
        return;
    }

    window.location.hash = nextHash;
};
