// Keep the previous experience available without loading its styles or state by default.
if (new URLSearchParams(window.location.search).get('experience') === 'academy') {
    void import('./academy');
}
else if (new URLSearchParams(window.location.search).get('experience') === 'live') {
    void import('./temple/bootstrap');
}
else {
    void import('./shrine/bootstrap');
}
export {};
