# The Next Chapter of Our Brand

Interactive 18-slide presentation website for City Bank's Brand Motto Proposal, 2027.

The presentation includes the Citytouch campaign key visual, a continuous sonic-identity soundtrack, the sonic motion film and a three-phase launch recommendation for the new motto, brand film and sonic identity.

## Preview locally

From this folder, run:

```sh
python3 -m http.server 4173 --directory dist
```

Then open `http://localhost:4173`.

## Controls

- Right arrow, Page Down or Space: next slide
- Left arrow or Page Up: previous slide
- Home / End: first / last slide
- F: enter or exit fullscreen
- Swipe left or right on touch devices
- Choose **Start with sound** to play **Sound of Beginning** continuously at a 10% default level
- Use the floating sound button to play/pause, skip, seek, mute or adjust volume

On Slide 12, the background soundtrack fades to zero while the sonic motion film plays at 50% volume. From Slide 13 onward, the background soundtrack fades back to its 10% presentation level. When the video is letterboxed, the surrounding space samples the top and bottom edge colours frame by frame for a seamless full-screen treatment.

The site is buildless and can be deployed from the contents of `dist/` to any static host.
