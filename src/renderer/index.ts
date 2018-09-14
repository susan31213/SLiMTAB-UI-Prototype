import { FingerBoard } from '../common/FingerBoard';


function init() {
  const fb = new FingerBoard();
  let container: HTMLElement | null = document.getElementById('container');
  if(container != null) {
    container.appendChild(fb.domElement);
    container.appendChild(fb.pressPointElements);
  }

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
}

$(document).ready(() => {
  console.log('page is loaded and ready');
  init();
});
