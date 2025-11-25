# Background Pagination & Defaults Plan

## Goals
- Paginate app background options: show 9 at first, “See more” loads +6 each time, “See less” resets to initial 9.
- Include a “Default” option to reset to original gradient/color.
- Ensure avatar background always matches the selected background option.

## Updates
- Profile page preferences list should render paginated options with “See more”/“See less” controls and a “Default” option at the top.
- Theme store: keep default option (e.g., `sky`) as reset target; avatarBg must apply everywhere the avatar renders.
- No change to selection storage: still use `appBackgroundId`.
