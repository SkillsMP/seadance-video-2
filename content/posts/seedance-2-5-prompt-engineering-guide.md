---
title: 'Seedance 2.5 Prompt Guide: Examples, Templates & Techniques'
description: 'A practical Seedance 2.5 prompt guide for cinematic shots, multimodal references, timing, camera movement, editing, audio, and reproducible video workflows.'
created_at: 2026-08-29
date: '2026-08-29'
author_name: 'Seadance AI Editorial'
categories: ['tutorials-guides']
tags:
  [
    'Seedance 2.5 prompt guide',
    'Seedance 2.5 prompts',
    'Seedance prompting',
    'AI video prompts',
    'Seedance reference video',
  ]
---

A strong **Seedance 2.5 prompt** is a directing brief, not a pile of cinematic adjectives. It tells the model what is present, what changes, when it changes, how the camera moves, and what must stay stable.

Seedance 2.5 supports a broader multimodal workflow than a text-only prompt. The prompt still matters because it assigns roles to image, video, and audio references and explains the intended edit.

## A practical Seedance 2.5 prompt formula

Use this order:

1. **Subject and identity:** who or what is in the shot, including the details that must remain stable;
2. **Environment:** location, time, weather, materials, background, and depth;
3. **Action and timing:** observable actions in sequence, with simple time windows;
4. **Camera and composition:** shot size, camera path, focus, angle, lens feel, and aspect ratio;
5. **Lighting and color:** source direction, softness, temperature, contrast, and palette;
6. **Audio:** dialogue, ambience, effects, music, or silence;
7. **Constraints:** what not to add, change, or invent.

A compact example:

> 16:9 cinematic tracking shot of the same ceramicist in a warm workshop. From 0–4s, she places a blue bowl on the wheel. From 4–9s, the camera moves from a medium shot to a close-up as her hands shape the rim. Preserve her face, linen apron, bowl color, and workshop layout. Soft window light from camera left, quiet wheel hum and room tone, no extra people, no generated subtitles.

## Camera movement and composition

Describe the camera as a physical action:

- slow push-in toward the subject;
- lateral tracking at eye level;
- locked-off close-up;
- overhead reveal;
- gentle orbit around a product;
- handheld follow shot;
- rack focus from foreground prop to subject;
- pull-back to a wide ending frame.

Avoid combining incompatible directions such as “locked camera with a fast orbit.” If a transition matters, say where it begins and ends.

For a 9:16 social clip, keep the subject and any approved text in a safe central area. For a product shot, specify label orientation and the surface that should remain visible.

## Text-to-video prompt examples

### Cinematic scene

> A single continuous shot follows a courier through a rain-wet night market. From 0–3s, the camera tracks behind at shoulder height. From 3–8s, the courier stops under a warm awning and looks toward a distant train. Neon reflections, realistic wet pavement, restrained color, natural footsteps and rain, 16:9, end on a steady profile.

### Product video

> Macro product film of a matte black travel mug on a walnut table. A hand places the mug down from 0–2s, steam rises from 2–5s, and the camera makes a slow half-orbit to reveal the lid. Preserve the mug shape and label placement, soft key light, no extra logos or text, clean 1:1 composition.

### Vertical UGC concept

> 9:16 creator-style product demonstration in a bright kitchen. Open with a natural question in the first second, show the authorized bottle being used from 1–5s, then hold a readable product close-up and finish with the approved call to action. Keep the person fictional or authorized, use clear voice timing, no invented claims.

## Prompting with references

When using image, video, or audio references, assign each one a role.

- Use an image for identity, composition, product appearance, location, or style.
- Use a video for motion, blocking, timing, or camera language.
- Use audio for voice, rhythm, ambience, or effects when the provider supports it.
- Use a clay render or white model for spatial structure and camera blocking.

A clear reference instruction looks like this:

> Use @Image 1 for the character’s face and wardrobe, @Image 2 for the room layout, and @Video 1 for the camera path. Preserve the character identity and relative positions. Change the room from a studio to a sunlit train carriage. From 0–10s, keep the same slow lateral movement and end on the composition shown in @Image 2.

The exact reference syntax depends on the provider. Do not assume the syntax from one app works in another.

## Timing and long-form prompts

Seedance 2.5 is designed for up to 30 seconds in a single generation, with multi-round extensions described in the official release. Use time windows for a story:

- 0–5s: establish the location and subject;
- 5–12s: start the main action;
- 12–20s: create the transition or turning point;
- 20–30s: resolve the action and hold a usable ending frame.

Use fewer simultaneous actions when consistency matters. A prompt with a dozen cuts, several characters, and conflicting camera directions is difficult to troubleshoot.

## Editing prompts

An edit prompt should identify:

- the source image or video;
- the timestamp or segment;
- the object, person, background, or camera attribute to change;
- what must stay unchanged;
- how light, shadow, hair, clothing, and motion respond;
- the desired ending.

For example:

> Using @Video 1, replace the green-screen background from 0–10s with a dusk stadium. Preserve the runner’s blocking, clothing, and camera timing. Match the new light direction, cast shadows, and reflections. Keep the final pose and audio timing unchanged.

## Negative prompts and constraints

Negative prompts are not a universal switch, but explicit constraints can reduce avoidable errors. Use only constraints that matter:

- no extra people;
- no duplicate props;
- no unreadable text;
- preserve the product shape;
- keep the camera path continuous;
- no sudden cuts;
- no changes to the authorized face or wardrobe;
- no added music.

A long list of generic negatives can conflict with the creative brief. Use a short constraint block and inspect the output.

## Version and access notes

The current provider, model ID, mode, duration, output setting, and reference limit matter as much as the text. The browser generator on Seadance Video currently uses Seedance 2.0; this guide prepares prompts that can be adapted to a supported Seedance 2.5 surface.

For reusable Seedance 2.0 templates, visit the [Seedance 2.0 prompt guide](/prompts/seedance-2-0). For access and capability context, read [Seedance 2.5](/seedance-2-5).

## FAQ

### How do I prompt Seedance 2.5?

Use subject, environment, action and timing, camera, lighting, audio, references, and constraints. Keep the shot internally consistent and test one change at a time.

### What is the best Seedance 2.5 prompt length?

There is no universal length. Include decisions that affect the shot and remove adjectives that do not change the image, motion, camera, sound, or timing.

### Can I use first and last frames?

Some providers expose first-frame or first-and-last-frame workflows. Check the selected model, mode, duration, and input rules.

### Does Seedance 2.5 support reference video?

Official materials describe reference-video workflows. The current provider determines the accepted format, duration, count, and syntax.

### Can a prompt force 1080p or 4K?

No. Select the output option exposed by the provider and verify the downloaded file’s dimensions.

### Can I use a Claude or prompt-writing skill for Seedance 2.5?

A skill can help structure a brief, but it does not grant model access. Review the prompt, references, rights, API credentials, and provider terms before submitting.
