# Bruegel artwork

Decorative figures for the home page (opening scene and stakeholder question panels).

**Source:** *Children's Games* (1560), Pieter Bruegel the Elder, Kunsthistorisches Museum, Vienna.
Reproduction from [Wikimedia Commons / Google Arts & Culture](https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder_-_Children%E2%80%99s_Games_-_Google_Art_Project.jpg),
marked Public Domain. Credited on `/credits/`.

| File | What it is |
| --- | --- |
| `childrens-games.webp` | the original reproduction (1280×930), backdrop of the opening scene |
| `blue.webp`, `walker.webp` | standing figures |
| `circle.webp`, `linked.webp`, `barrel.webp`, `hoops.webp` | interacting groups (ring play, linked children, barrel play, hoop play) |

The figures are AI-assisted adaptations (background extraction, halo clean-up), not
pixel-identical crops. They were prepared as two transparent atlases in the design package
and cut here into one WebP per figure, so each page loads only what it shows:

```
blue    atlas   140,48   210×400      circle  groups  130,50   605×450
walker  atlas  1093,22   367×476      linked  groups  840,60   610×438
                                      barrel  groups  100,501  665×495
                                      hoops   groups  790,580  735×414
```

```sh
cwebp -q 82 -alpha_q 90 -m 6 -crop X Y W H <atlas>.png -o <name>.webp
cwebp -q 72 -m 6 bruegel-original.jpg -o childrens-games.webp
```

Scrolling moves the figures a few pixels (`scripts/main.js`); the movement is decorative and never
represents a simulated intervention or outcome. `prefers-reduced-motion` turns it off.
