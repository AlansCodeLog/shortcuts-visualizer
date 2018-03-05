const shortcuts = [
   {
      shortcut: "ctrl+a",
      command: "Command A"
   },
   // {
   //    shortcut: "ctrl+q",
   //    command: "Command q"
   // },
   // {
   //    shortcut: "ctrl+shift+s",
   //    command: "Test Shift S"
   // },
   {
      shortcut: "ctrl+q",
      command: "Command Q",
      contexts: ["B"]
      // chain_start: true,
   },
   // {
   //    shortcut: "ctrl+s b",
   //    command: "Chained B"
   // },
   {
      shortcut: "ctrl+s",
      command: "Custom Chain Text S",
      chain_start: true,
   },
   {
      shortcut: "ctrl+b",
      command: "Custom Chain Text B",
      chain_start: true,
   },
   // {
   //    shortcut: "ctrl+s ctrl+a",
   //    command: "Chained Ctrl A"
   // },
   {
      shortcut: "ctrl+s s",
      command: "Command Chain S"
   },
   {
      shortcut: "ctrl+b b",
      command: "Command Chain B"
   },
   // {
   //    shortcut: "ctrl+s a",
   //    command: "Not detecting this duplicate"
   // },
]

export {shortcuts}