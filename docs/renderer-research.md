# Renderer Research

Date: 2026-06-04

## Decision

Use a custom browser renderer for the chat bubble.

```text
Krita assets
  -> custom HTML/CSS/JS renderer
  -> browser preview
  -> OBS Browser Source
  -> later YouTube adapter
```

Do not build the first version by restyling YouTube popout chat. That path is useful for normal chat boxes, but this project needs a single hand-drawn adaptive bubble with fixed avatar, nameplate, cloud cap, and decorations.

## Why Custom Renderer Wins

The bubble has its own visual contract:

- avatar is mandatory and fixed
- nameplate has controlled width/clamping
- message body expands with text
- corners/decorations must not stretch
- YouTube is only one future data source

If the renderer owns the DOM, the later YouTube adapter only needs to normalize incoming chat into:

```js
{
  name: "ricy_rice",
  role: "member",
  message: "Hawoo hewoo haiii",
  avatar: "assets/export/avatar.png"
}
```

## Alternatives Checked

### YouTube popout chat + custom CSS

Useful for quick overlays, not the best base here.

Pros:
- fastest path to a live YouTube chat overlay
- OBS can load the popout URL as a Browser Source
- CSS-only examples exist

Cons:
- depends on YouTube's DOM structure
- hard to turn each message into a custom art-directed bubble
- avatar/nameplate/decorations are constrained by YouTube markup
- less portable to non-YouTube sources

Reference example:
- https://github.com/EuSouGuil/youtube-live-chat-overlay

### Existing chat overlay tools

Useful later as adapter/inspiration, not as the core renderer.

Pros:
- can forward chat events to OBS
- already solves some transport/state problems

Cons:
- visual system is not your drawn asset
- adds external workflow before the bubble itself is proven
- can obscure the renderer contract you need to own

Reference example:
- https://github.com/steveseguin/twitch-youtube-restream-chat-overlay

### Canvas renderer

Not first choice.

Pros:
- full drawing control
- can export images cleanly

Cons:
- text wrapping, font sizing, accessibility, and layout become manual code
- slower learning path for this project
- OBS/browser still need a webpage around it

### SVG renderer

Possible later if the art becomes vector-first.

Pros:
- scalable vector shapes
- good for clean paths and simple decoration

Cons:
- raster Krita textures/decorations still need image handling
- dynamic text and wrapping are more awkward than normal HTML/CSS

## Official Docs Endpoints

OBS Browser Source:
- https://obsproject.com/kb/browser-source
- Use this for local file, URL, viewport width/height, transparency, and OBS preview behavior.

OBS Browser plugin / JS bindings:
- https://github.com/obsproject/obs-browser
- Use this only if the overlay later needs OBS-specific JavaScript integration.

CSS border image / 9-slice:
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image-slice
- Use this if PNG-sliced borders are needed.

CSS Grid:
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-columns
- Use this for the manual 9-slice grid mental model: fixed corners, stretch edges, fill center.

YouTube live chat messages:
- https://developers.google.com/youtube/v3/live/docs/liveChatMessages
- https://developers.google.com/youtube/v3/live/docs/liveChatMessages/streamList
- https://developers.google.com/youtube/v3/live/docs/liveChatMessages/list
- Use these later for the YouTube adapter. `streamList` is the preferred low-latency consumption path; `list` documents paging and polling behavior.

## GitHub References

OBS Browser source implementation:
- https://github.com/obsproject/obs-browser

YouTube popout chat CSS overlay:
- https://github.com/EuSouGuil/youtube-live-chat-overlay

Selectable multi-platform chat overlay:
- https://github.com/steveseguin/twitch-youtube-restream-chat-overlay

## Implementation Rule

Build the renderer from the inside out:

```text
nameplate
  -> message body
  -> avatar anchor
  -> decorative overlays
  -> preview controls
  -> window.setBubble
  -> later YouTube adapter
```

For image slicing:

```text
nameplate width-only
  -> 3-slice or CSS

message body width + height
  -> 9-slice or CSS grid/CSS-first equivalent

decorations
  -> separate fixed overlays
```

