import { FingerBoard, NoteInfo } from '../common/FingerBoard';
var fb: FingerBoard;

function init() {
  fb = new FingerBoard();

  window.addEventListener("resize", redrawCanvas, false);
  redrawCanvas();

  // add button listener
  let pressBtn = document.getElementById("pressBtn") as HTMLElement;
  let unpressBtn = document.getElementById("unpressBtn") as HTMLElement;
  let pickBtn = document.getElementById("pickBtn") as HTMLElement;

  pressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;
    fb.press(stringID as number, note);
  });

  unpressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;
    fb.unPress(stringID as number, note);
  });

  pickBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    fb.pick(stringID as number);
  });

  // Callbacks (Debuggggggggggg)
  let sf1 = document.getElementById("sf1") as HTMLElement;
  let usf1 = document.getElementById("usf1") as HTMLElement;
  let sf2 = document.getElementById("sf2") as HTMLElement;
  let usf2 = document.getElementById("usf2") as HTMLElement;

  sf1.addEventListener("click", () => {
    fb.subscribe("press", f1);
  })
  usf1.addEventListener("click", () => {
    fb.unSubscribe("press", f1);
  })
  sf2.addEventListener("click", () => {
    fb.subscribe("press", f2);
  })
  usf2.addEventListener("click", () => {
    fb.unSubscribe("press", f2);
  })
  

  function redrawCanvas() {
    fb.drawCanvasAndPressPoints();
    let container: HTMLElement | null = document.getElementById('container');
    if(container != null) {
      container.childNodes.forEach(element => {
        element.remove();
      });
      container.appendChild(fb.domElement);
      container.style.height = (fb.domElement.height+2) + "px";
      container.style.width = (fb.domElement.width) + "px";
      container.appendChild(fb.pressPointElements);
    }
  }

  function f1(note: NoteInfo) {
    let htmlDiv = note.htmlElement;
    console.log("f1: " + note.divIndex + ", " + note.string + " " + note.note + " ");
    if(htmlDiv != undefined)
      htmlDiv.className = (htmlDiv.className == "press")? "unPress":"press";
  }

  function f2(note: NoteInfo) {
    console.log("f2: " + note.divIndex + ", " + note.string + " " + note.note);
  }

}



$(document).ready(() => {
  init();
});