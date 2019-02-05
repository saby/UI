/// <amd-module name="UI/_base/HeadController" />

function setTitle(newTitle: String) {
   if (typeof window !== 'undefined') {
      window.document.head.title = newTitle;
   }
}

export default {
   setTitle
}
