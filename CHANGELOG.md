# StriveApp Changelog

All notable changes to StriveApp are documented here.

---

## [Unreleased] — In Development

### Summary Tab (HomeScreen)
- Activity Ring color changed from red/pink to **green** (`#30D158`) to match app theme
- Mini ring in the Active Workout dock also updated to green

### Active Workout Screen
- Full-screen map mode now shows a **2-column stats HUD** (KM, KM/H, ACTIVE KCAL, STEPS) overlaid on the map — no background, clean floating text with drop shadows
- Full-screen map now shows the **bottom dock** (timer, pause/resume, stop) as a floating modal over the map — no need to go back to stats view to control the workout

### Countdown Screen *(new)*
- Added Apple Fitness-style **3-2-1 countdown** before every workout starts
- Single continuous green ring that drains from full → empty over 3 seconds
- Number changes at each 1-second mark (3 → 2 → 1)
- Haptic feedback on each tick, heavy haptic at GO
- Fades out and transitions directly into ActiveWorkoutScreen
- Tab bar hidden during countdown

### Navigation Screen *(new)*
- Added dedicated **turn-by-turn navigation screen** (like Waze / Apple Maps)
- Triggered from Explore tab when a route is loaded and user taps the navigate button
- Features: 3D tilted map (pitch 65°), camera follows navigation puck, route snapping (forward only)
- Top card: current instruction (icon + text + street name) + next step preview with BlurView background
- Bottom panel: ETA, remaining distance, current speed (km/h), End button
- Recenter button to snap camera back to puck
- Traveled portion of route dimmed, remaining route bold green
- Turn markers at each upcoming step
- Tab bar hidden during navigation

### Explore Tab / Map Screen
- Navigation now opens a **dedicated NavigationScreen** instead of inline HUD
- MapScreen cleaned up — removed all inline nav state (snap logic, step markers, nav puck) since those moved to NavigationScreen
- `MapScreen` now accepts `navigation` prop for stack navigation

### History Tab *(new)*
- Replaced **Sharing** tab with **History** tab (clock icon)
- Wraps `ActivityHistoryScreen` in a proper stack with `ActivityDetail` and `Settings` sub-screens
- Tapping any activity in History navigates to the full `ActivityDetailScreen` (with replay)

### Tab Bar (CustomTabBar)
- Tab bar now hides on: `ActiveWorkout`, `GymWorkout`, `ActivityDetail`, `StatsDetail`, `Navigation`, `Countdown`
- 4th tab updated from "Sharing" (people icon) → "History" (time/clock icon)
- Hide logic improved — iterates all tab routes to reliably detect nested sub-screens

### Navigation (AppNavigator)
- Added `ExploreStack` wrapping `MapScreen` + `NavigationScreen`
- Added `CountdownScreen` to both `HomeStack` and `WorkoutStack`
- Added `HistoryStack` replacing `SocialPlaceholder`
- Removed unused imports and dead code

---

## [1.0.0] — Initial Build

### Core App
- Converted Flutter JZWorkout app to **React Native / Expo SDK 54**
- N-tier architecture: `core/`, `data/`, `domain/`, `presentation/`
- Compatible with **Expo Go** on iPhone

### Navigation
- 4-tab custom tab bar with **BlurView** background and animated green highlight
- Snake/glow border animation on tab switch
- Tabs: Summary, Explore, Workout, Sharing

### Summary Tab (HomeScreen)
- Apple Fitness-style dashboard
- Activity Ring (SVG) with move calories progress
- Step Count and Distance cards with mini bar charts
- Sessions and Duration cards
- Recent activities list with map thumbnails
- Tappable cards navigate to `StatsDetailScreen` with D/W/M/Y chart periods

### Explore Tab (MapScreen)
- Apple Maps integration (`react-native-maps`, `PROVIDER_DEFAULT`)
- Long-press to set destination
- Road-snapped directions via **OSRM** API
- Route displayed as green polyline
- Map type selector: Dark / Light / Hybrid / Satellite
- Recenter button

### Workout Tab (WorkoutSelectScreen)
- Select activity: Outdoor Walk, Outdoor Run, Outdoor Cycle, Strength Training
- MP4 video thumbnails (circular) as activity icons — looping, muted
- GlassCard gradient backgrounds
- Tapping a card starts the workout

### Active Workout Screen
- Apple Fitness-style stats: KM, KM/H, ACTIVE KCAL, TOTAL KCAL
- Mini map (220px, 3D tilt) with expand button
- Full-screen map mode with 3D tilt, heading cone, stats overlay
- Route trail — bold green polyline following user
- Bottom dock: video icon, elapsed timer, mini activity ring, pause/resume, stop
- GPS tracking via `expo-location`
- Step count estimated from distance
- Keep screen awake during workout

### Activity Detail & Replay Screen
- Full-screen map with complete route overview
- **Route Replay**: smooth interpolated marker (5 sub-points per GPS segment)
- 3D tilted camera (pitch 60°) follows marker during replay
- Stats HUD overlay: KM, Speed, Duration
- Speed selector: 0.5x, 1x, 2x, 5x (default), 10x, 20x
- Playback controls: restart, rewind, play/pause, forward
- Auto-center lock with pan-to-unlock and recenter button
- Map type: Hybrid

### Share Card (ShareCard widget)
- Full-screen editor with preview/edit toggle
- Draggable stat blocks and route line (PanResponder, clamped to card bounds)
- Background color picker, image picker with blur slider
- Route color picker, watermark text input, size controls
- SVG route line (`react-native-svg`)
- Save to gallery via `expo-media-library`

### Stats Detail Screen
- D / W / M / Y period selector
- Real data charts per stat type (steps, distance, sessions, duration)
- Matching accent colors per stat

### Design System
- **GlassCard**: LinearGradient background (silver-top → dark-bottom)
- **ThemeContext**: dark/light mode, glass design modes (Solid/Clear/Tinted)
- Theme persisted to AsyncStorage
- Settings screen with design mode toggle

### EAS Build Config
- `eas.json` and `app.json` configured
- Bundle identifier, permissions (location, motion, photos, camera), plugins set up
