// Keep the previous experience available without loading its styles or state by default.
if (new URLSearchParams(window.location.search).get('experience') === 'academy') {
    void import('./academy');
}
else {
    void import('./temple/bootstrap');
}
export {};
