// Keep the previous experience available without loading its styles or state by default.
if (['/admin/tiktok','/broadcast/tiktok'].includes(window.location.pathname)) {
    void import('./templeLive/bootstrap');
}
else if (new URLSearchParams(window.location.search).get('experience') === 'academy') {
    void import('./academy');
}
else if (new URLSearchParams(window.location.search).get('experience') === 'live') {
    void import('./temple/bootstrap');
}
else if (new URLSearchParams(window.location.search).get('experience') === '3d') {
    void import('./shrine/bootstrap');
}
else {
    void import('./photo/bootstrap');
}
export {};
