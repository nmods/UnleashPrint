# UnleashPrint

Shows rotation used in unleash<br />
Also shows total damage and total amount of rampages used

### Commands
All commands start with `unleashprint` and are sent to proxy channel (`/8`)
- `last` `<optional argument>`
  - Prints last unleash
  - If `argument` is given, prints last `argument` amount of unleashes
    - Example: `/8 unleashprint last 2` will print last 2 unleashes
- `toggle`/`mode` `<optional argument>`
  - Changes mode of tracking skills in unleash
  - Valid modes: `skill`, `damage`, `both`
  - Default mode is `damage`
  - If no argument, shows current mode

### Print
![Screenshot](https://i.imgur.com/5fnGaDT.png)<br />
`[20:54:58]` Timestamp<br />
`D:` Mode: `damage` (Would be S for `skill`)<br />
`Total: 126M` Total damage<br />
`26R` 26x Rampages done in whole Unleash

`1BF` 1x Beast Fury (damage)<br />
`6D-5S` 6x `Dexter` and 5x `Sinister`, alternating and starting with `Dexter`<br />
`14R` 14x `Rampage`<br />
and so on...