# shortcut-visualizer

This is WIP.

I prefer to use a custom set of keyboard shortcuts for most of my programs, but for some, there's just soooo many shortcuts to think about, that it's super hard to plan these out. My idea is to create a keyboard shortcut visualizer/organizer that lets you preview them similar to how this [site]() does it, but that also allows you to easily customize them (through drag/drop and/or a list) similar to how Adobe Premiere now lets you edit keyboard shortcuts (except even that implementation is still super clunky).

Eventually it would be nice to support some way to import/export them, at least for the most popular programs, and also to package it as a standalone library that would allow it to be plugged into any javascript app.

## Status/TODOs

[x] Responsive Keyboard CSS
[ ] Responsive Text Size
[x] Base Key Object
[x] Flexible Layout
[~] Simple Key Detection
[ ] Shortcut List
[ ] Show Active Shortcuts
[ ] Custom Modifier Keys (e.g. use Tab as a modifier, or disable Shift, like for a text editor)
[ ] Program Contexts
[ ] Drag/Drop Bin w/ Search
[ ] Custom Remaps (e.g. Capslock = Ctrl + Alt + Shift)


## Build Setup

Based on Vue's Webpack Template

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```
