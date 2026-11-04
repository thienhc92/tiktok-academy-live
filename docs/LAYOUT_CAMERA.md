# Vietnamese responsive layout and camera correction

Admin mode entry now lives in a normal document-flow row between the header and
page heading, outside the clipped 3D canvas. Vietnamese controls wrap at narrow
widths, with no fixed overlay on page content. Broadcast retains its separate
revealable controls and 9:16 composition.

A shared CameraRig fits distance to canvas aspect ratio, sets a front school view
on resize/reset, and bounds orbit angles/zoom so students remain in frame. The
same wider 4×5 student arrangement is used in Admin and Broadcast; the gate/floor
extend to clear the front row. All 20 avatar meshes remain rendered. The Vietnamese
Đặt lại camera button is available in Admin and revealed Broadcast controls.
Orbit damping is disabled so resetting after a drag does not retain angular drift.

Nickname/rank pairs stay together. A small screen-space label pass checks at most
about seven times per second, batches reads before writes, and temporarily hides
colliding labels with priority for the selected student. Labels return as space
opens or the camera resets; avatars are never hidden. This is a practical declutter
policy, not a promise that all 20 long titles fit at every orbit angle. Selection,
XP, quizzes, exams, promotions and local storage are unchanged.

Validation: 38 unit tests and TypeScript/Vite build. Chromium software-WebGL smoke
covers 768×1024, 1024×768, 820×1180 and 320×568: header/control separation, no horizontal
scrolling, student label bounds, orbit declutter, default-view reset and Broadcast
9:16/reset. Physical iPad Safari, stream capture and frame-rate remain unverified.
The existing large JavaScript bundle warning remains.

Portrait Admin tablets use one full-width scene column; landscape keeps the dashboard
columns. Phone Admin uses a taller scrollable scene rather than compressing labels.
The final browser run showed all 20 labels in each default view at the four tested
sizes. During orbit, overlapping labels may still be temporarily hidden as above.
