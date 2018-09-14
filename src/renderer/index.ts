import { FingerBoard } from '../common/FingerBoard';
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

  function redrawCanvas() {
    fb.DrawCanvasAndPressPoints();
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
}



$(document).ready(() => {
  init();
});